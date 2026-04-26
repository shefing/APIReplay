export function renderRecordingOptions(
  selectItems: HTMLElement,
  recordings: string[],
  onSelect: (recordingName: string) => void
) {
  selectItems.innerHTML = '';

  recordings.forEach((recording) => {
    const div = document.createElement('div');
    div.textContent = recording;
    div.addEventListener('click', () => onSelect(recording));
    selectItems.appendChild(div);
  });
}

export function initRecordingSelect(
  selectElement: HTMLInputElement,
  selectItems: HTMLElement,
  onInput: () => void
) {
  selectElement.addEventListener('input', () => {
    const filter = selectElement.value.toUpperCase();
    const options = selectItems.getElementsByTagName('div');

    for (let i = 0; i < options.length; i += 1) {
      const txtValue = options[i].textContent || options[i].innerText;
      options[i].style.display = txtValue.toUpperCase().indexOf(filter) > -1 ? '' : 'none';
    }

    selectItems.classList.remove('select-hide');
    onInput();
  });

  selectElement.addEventListener('focus', () => {
    selectItems.classList.remove('select-hide');
  });

  document.addEventListener('click', (e) => {
    if (!selectElement.contains(e.target as Node) && !selectItems.contains(e.target as Node)) {
      selectItems.classList.add('select-hide');
    }
  });
}
