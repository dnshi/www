import exhibit from './exhibit.json';
import type { SignalWorld } from './scene';

function required<T extends Element = HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing Signal Dive element: ${selector}`);
  return element;
}

const shell = required('#game-shell');
const resume = required('#resume');
const resumeDialog = required<HTMLDialogElement>('#resume-dialog');
const chapterDialog = required<HTMLDialogElement>('#experience-dialog');
const mapDialog = required<HTMLDialogElement>('#map-dialog');
const dialogs = [resumeDialog, chapterDialog, mapDialog];
const records = [...document.querySelectorAll<HTMLDetailsElement>('.experience-record')];
const enter = required<HTMLAnchorElement>('#enter-system');
const status = required('#world-status');
const flight = required('#flight-ui');
const previousStation = required<HTMLButtonElement>('#previous-station');
const nextStation = required<HTMLButtonElement>('#next-station');
const motionButton = required<HTMLButtonElement>('#motion-toggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const connected = new Set<number>();
let world: SignalWorld | undefined;
let entered = false;
let ready = false;
let fallback = false;
let currentZone = 0;
let selectedRecord = -1;
let returnHash = '';
let restoreFocus: HTMLElement | null = null;
let motionEnabled = !reducedMotion.matches;
let activeFilter = 'all';
let lastProgress = -1;
let atMilestone = false;

enter.textContent = 'Opening my path…';
enter.setAttribute('aria-disabled', 'true');
required('#resume-mount').append(resume);
document.body.classList.add('game-enhanced');
required('#journey-menu').removeAttribute('hidden');
if (matchMedia('(pointer: coarse)').matches) {
  required('#flight-hint').textContent = 'Drag to drift · Swipe up to travel';
}
document.addEventListener('pointerdown', (event) => {
  if (event.pointerType === 'touch') required('#flight-hint').textContent = 'Drag to drift · Swipe up to travel';
}, { passive: true });

function stationIndexForRecord(id: string): number {
  return exhibit.stations.findIndex((item) => item.records.includes(id));
}
function setStatus(message: string): void {
  status.textContent = message;
}
function updateZone(index: number): void {
  const station = exhibit.stations[index];
  if (!station) throw new RangeError(`Unknown career world: ${index}`);
  currentZone = index;
  required('#zone-number').textContent = `${station.number} / ${station.period}`;
  required('#zone-title').textContent = station.title;
  required('#zone-company').textContent = station.subtitle;
  required('#zone-hint').textContent = station.summary;
  required('#zone-proof').textContent = station.proof;
  const detailsLink = required<HTMLAnchorElement>('#milestone-read');
  detailsLink.href = `#${station.record}`;
  detailsLink.dataset.openRecord = station.record;
  shell.dataset.milestone = station.id;
  previousStation.disabled = index === 0;
  nextStation.innerHTML = index === exhibit.stations.length - 1
    ? 'Say hello <span aria-hidden="true">↗</span>'
    : 'Next chapter <span aria-hidden="true">→</span>';
  document.querySelectorAll<HTMLAnchorElement>('.route-map [data-travel]').forEach((link) => {
    link.setAttribute('aria-current', String(link.dataset.travel === station.id));
  });
  if (entered) setStatus(`${station.period}. ${station.subtitle}. ${station.summary}`);
}
function connect(index: number): void {
  if (connected.has(index)) return;
  connected.add(index);
  world?.activate(index);
  required('#connected-count').textContent = `${connected.size} / ${exhibit.stations.length} chapters explored`;
  const station = exhibit.stations[index];
  document.querySelectorAll<HTMLElement>('[data-travel]').forEach((link) => {
    if (link.dataset.travel === station?.id) link.classList.add('is-connected');
  });
  if (connected.size === exhibit.stations.length) setStatus('From first products to shared platforms. That is my path so far.');
}
function begin(): void {
  if (!world || !ready || fallback) return;
  entered = true;
  shell.classList.add('is-playing');
  flight.hidden = false;
  world.begin();
  setStatus(motionEnabled ? 'My path starts at Acadia, then follows the products and platforms I helped build.' : 'Motion is off. Explore my career at your own pace.');
  nextStation.focus({ preventScroll: true });
}
function travel(index: number): void {
  if (!world || !ready) return;
  if (!entered) begin();
  world.travelTo(index);
  atMilestone = false;
  const station = exhibit.stations[index];
  setStatus(`${station?.period} / ${station?.subtitle}`);
}

function openDialog(dialog: HTMLDialogElement): void {
  if (!dialogs.some((item) => item.open)) {
    restoreFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (location.hash !== '#resume' && !records.some((record) => `#${record.id}` === location.hash)) returnHash = location.hash;
  }
  for (const other of dialogs) if (other !== dialog && other.open) other.close();
  if (!dialog.open) dialog.showModal();
  world?.suspend(true);
  dialog.querySelector<HTMLButtonElement>('[data-close-dialog]')?.focus({ preventScroll: true });
}
function updateHash(hash: string, replace: boolean): void {
  if (location.hash === hash) return;
  if (replace) history.replaceState(null, '', hash);
  else history.pushState(null, '', hash);
}
function showResume(updateHistory = true, section?: string): void {
  if (fallback) {
    resume.scrollIntoView({ behavior: 'instant' });
    return;
  }
  const wasOpen = dialogs.some((dialog) => dialog.open);
  openDialog(resumeDialog);
  if (updateHistory) updateHash('#resume', wasOpen);
  if (section) required(`#${section}`).scrollIntoView({ block: 'start', behavior: 'instant' });
}
function openRecord(id: string, updateHistory = true): void {
  const index = records.findIndex((record) => record.id === id);
  const record = records[index];
  if (!record) return;
  selectedRecord = index;
  const content = record.querySelector('.record-content');
  if (!content) throw new Error(`Missing résumé content for ${id}`);
  required('#dialog-index').textContent = `CHAPTER ${String(index + 1).padStart(2, '0')} / ${records.length}`;
  required('#dialog-company').textContent = record.querySelector('.record-company')?.textContent ?? '';
  required('#dialog-role').textContent = record.querySelector('.record-role')?.textContent ?? '';
  required('#dialog-period').textContent = record.querySelector('.record-period')?.textContent ?? '';
  required('#dialog-content').replaceChildren(content.cloneNode(true));
  required<HTMLButtonElement>('#previous-record').disabled = index === 0;
  required<HTMLButtonElement>('#next-record').disabled = index === records.length - 1;
  const stationIndex = stationIndexForRecord(id);
  if (stationIndex >= 0) connect(stationIndex);
  const wasOpen = dialogs.some((dialog) => dialog.open);
  openDialog(chapterDialog);
  if (updateHistory) updateHash(`#${id}`, wasOpen);
  chapterDialog.scrollTop = 0;
}
function syncLocation(): void {
  const id = location.hash.slice(1);
  if (records.some((record) => record.id === id)) openRecord(id, false);
  else if (['resume', 'expertise', 'education', 'experience'].includes(id)) showResume(false, id === 'resume' ? undefined : id);
  else dialogs.forEach((dialog) => { if (dialog.open) dialog.close(); });
}

document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element) || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  const resumeLink = event.target.closest<HTMLAnchorElement>('[data-resume]');
  if (resumeLink) {
    event.preventDefault();
    showResume();
    return;
  }
  const chapterLink = event.target.closest<HTMLAnchorElement>('[data-open-record]');
  if (chapterLink) {
    event.preventDefault();
    openRecord(chapterLink.hash.slice(1));
    return;
  }
  const destination = event.target.closest<HTMLAnchorElement>('[data-travel]');
  if (destination) {
    event.preventDefault();
    const index = exhibit.stations.findIndex((station) => station.id === destination.dataset.travel);
    if (index < 0) throw new Error(`Unknown journey destination: ${destination.dataset.travel}`);
    if (!world) {
      openRecord(exhibit.stations[index]?.record ?? '');
      return;
    }
    if (mapDialog.open) mapDialog.close();
    travel(index);
  }
});
enter.addEventListener('click', (event) => {
  event.preventDefault();
  if (fallback) showResume();
  else begin();
});
required('#home-link').addEventListener('click', (event) => {
  event.preventDefault();
  dialogs.forEach((dialog) => { if (dialog.open) dialog.close(); });
  entered = false;
  flight.hidden = true;
  shell.classList.remove('is-playing');
  world?.reset();
  setStatus('From Acadia to Fabric. Follow my path, or open the complete résumé.');
  enter.focus({ preventScroll: true });
});
required('#journey-menu').addEventListener('click', () => openDialog(mapDialog));
document.querySelectorAll<HTMLButtonElement>('[data-close-dialog]').forEach((button) => {
  button.addEventListener('click', () => button.closest('dialog')?.close());
});
for (const dialog of dialogs) {
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      dialog.close();
    }
  });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    const anotherOpen = dialogs.some((item) => item.open);
    world?.suspend(anotherOpen);
    if (anotherOpen) return;
    if (['#resume', '#expertise', '#education', '#experience'].includes(location.hash)
      || records.some((record) => `#${record.id}` === location.hash)) {
      history.replaceState(null, '', `${location.pathname}${location.search}${returnHash}`);
    }
    restoreFocus?.focus({ preventScroll: true });
  });
}
required('#previous-record').addEventListener('click', () => {
  const record = records[selectedRecord - 1];
  if (record) openRecord(record.id);
});
required('#next-record').addEventListener('click', () => {
  const record = records[selectedRecord + 1];
  if (record) openRecord(record.id);
});
required('#dialog-read').addEventListener('click', (event) => {
  event.preventDefault();
  const record = records[selectedRecord];
  showResume();
  if (record) {
    record.open = true;
    record.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
});
previousStation.addEventListener('click', () => travel(Math.max(0, currentZone - 1)));
nextStation.addEventListener('click', () => {
  if (currentZone === exhibit.stations.length - 1) showResume(true, 'contact');
  else travel(currentZone + 1);
});
document.addEventListener('keydown', (event) => {
  if (dialogs.some((dialog) => dialog.open) || !entered || !ready) return;
  if (event.target instanceof HTMLElement) {
    if (event.target.closest('input, textarea, select, [contenteditable=true]')) return;
    if (['Enter', ' '].includes(event.key) && event.target.closest('button, a, summary')) return;
  }
  if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
    event.preventDefault();
    travel(Math.min(exhibit.stations.length - 1, currentZone + 1));
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
    event.preventDefault();
    travel(Math.max(0, currentZone - 1));
  } else if ((event.key === 'Enter' || event.key === ' ') && atMilestone) {
    event.preventDefault();
    const station = exhibit.stations[currentZone];
    if (station) openRecord(station.record);
  }
});
function updateMotion(): void {
  motionButton.textContent = motionEnabled ? 'Motion on' : 'Motion off';
  motionButton.setAttribute('aria-pressed', String(!motionEnabled));
}
motionButton.addEventListener('click', () => {
  motionEnabled = !motionEnabled;
  world?.setMotion(motionEnabled);
  updateMotion();
  setStatus(motionEnabled ? 'Motion on. Follow the light.' : 'Motion off. Travel between worlds without animation.');
});
reducedMotion.addEventListener('change', () => {
  motionEnabled = !reducedMotion.matches;
  world?.setMotion(motionEnabled);
  updateMotion();
});
updateMotion();

function applyFilter(id: string): void {
  const filter = exhibit.filters.find((item) => item.id === id);
  activeFilter = filter?.id ?? 'all';
  document.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.filter === activeFilter));
  });
  records.forEach((record) => {
    const matches = filter?.records.includes(record.id) ?? false;
    record.classList.toggle('is-evidence', matches);
    if (matches) record.open = true;
  });
  const links = required('#evidence-links');
  links.replaceChildren();
  required('#evidence-description').textContent = filter
    ? `${filter.label}: ${filter.records.length} related chapters. Read the work behind each one.`
    : 'A connected view of frontend, infrastructure, performance, and platforms.';
  if (!filter) return;
  for (const id of filter.records) {
    const record = records.find((item) => item.id === id);
    if (!record) throw new Error(`Unknown capability evidence: ${id}`);
    const link = document.createElement('a');
    link.href = `#${id}`;
    link.dataset.openRecord = id;
    link.textContent = `${record.querySelector('.record-company')?.textContent} / ${record.querySelector('.record-period')?.textContent} ↗`;
    links.append(link);
  }
}
document.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => applyFilter(button.dataset.filter ?? 'all'));
});
function worldFailure(error: unknown): void {
  console.error('Signal Dive could not display its 3D world:', error);
  world?.dispose();
  world = undefined;
  fallback = true;
  ready = false;
  entered = false;
  required('#world').replaceChildren();
  shell.classList.remove('is-playing');
  shell.classList.add('game-failed');
  flight.hidden = true;
  dialogs.forEach((dialog) => { if (dialog.open) dialog.close(); });
  document.body.append(resume);
  document.body.classList.remove('game-enhanced');
  enter.textContent = 'Read the résumé ↗';
  enter.removeAttribute('aria-disabled');
  required('#journey-menu').setAttribute('hidden', '');
  setStatus('3D is unavailable on this device. The complete résumé is below — nothing is locked behind the game.');
}
async function loadWorld(): Promise<void> {
  try {
    const { createSignalWorld } = await import('./scene');
    world = createSignalWorld({
      mount: required('#world'),
      motion: motionEnabled,
      onZone: updateZone,
      onArrive: (index) => {
        const station = exhibit.stations[index];
        connect(index);
        if (connected.size < exhibit.stations.length && station) setStatus(`${station.period}. ${station.subtitle}. ${station.proof}`);
      },
      onProgress: (progress) => {
        const rounded = Math.round(progress * 1000);
        if (rounded === lastProgress) return;
        lastProgress = rounded;
        required('#route-progress').style.transform = `scaleX(${progress})`;
        shell.dataset.progress = progress.toFixed(3);
      },
      onApproach: (visible) => { atMilestone = visible && entered; },
      onInspect: (index) => {
        const station = exhibit.stations[index];
        if (station) openRecord(station.record);
      },
      onFailure: worldFailure
    });
    if (fallback) {
      world.dispose();
      world = undefined;
      return;
    }
    ready = true;
    shell.classList.add('world-ready');
    enter.innerHTML = 'Follow my path <span aria-hidden="true">→</span>';
    enter.removeAttribute('aria-disabled');
    connected.forEach((index) => world?.activate(index));
    world.suspend(dialogs.some((dialog) => dialog.open));
    setStatus('From Acadia to Fabric. A personal journey through products, delivery and platforms.');
  } catch (error) {
    worldFailure(error);
  }
}
addEventListener('hashchange', syncLocation);
addEventListener('popstate', syncLocation);
syncLocation();
void loadWorld();
