document.addEventListener("DOMContentLoaded", () => {

    let _file;
    let _filePos;
    let _frameNum;

    let _framesTbl;
    let _fileCtrls;

    let _loadingIcon;

    let _fieldsShown = {
        version: true,
        layer: true,
        protected: false,
        bitRate: true,
        sampleRate: true,
        padding: false,
        private: false,
        channelMode: true,
        copyright: false,
        original: false,
        emphasis: false,
    }

    const _sectionDescs = {
        "Sync": "This is what 'Sync' means.",
        "MPEG version ID": "This is what 'MPEG version ID' means",
        "Layer": "This is what 'Layer' means",
        "Protection bit": "This is what 'Protection bit' means",
        "Bitrate": "This is what 'Bitrate' means",
        "Sample rate (frequency)": "This is what 'Sample rate (frequency)' means",
        "Padding bit": "This is what 'Padding bit' means",
        "Private bit": "This is what 'Private bit' means",
        "Channel mode": "This is what 'Channel mode' means",
        "Copyright bit": "This is what 'Copyright bit' means",
        "Home (original bit)": "This is what 'Home (original bit)' means",
        "Emphasis": "This is what 'Emphasis' means",
    };

    class IndexPage {

        constructor() { }
        initialize() {
            // Add a change listener to the file input
            const fileInput = document.getElementById("file-input");
            fileInput.addEventListener("change", () => {
                const selFile = fileInput.files[0];
                this.openMp3File(selFile, () => {
                    const numFrames = fileInput.dataset.mp3Frames;
                    this.loadFrames(numFrames);
                });
            });

            // Add button-press listeners to the various load buttons
            const loadBtns = Array.from(document.getElementsByClassName("mp3-load-btn"));
            for (let b = 0; b < loadBtns.length; ++b) {
                const loadBtn = loadBtns[b];
                loadBtn.addEventListener("click", e => {
                    const numFrames = loadBtn.dataset.mp3Frames;
                    this.loadFrames(numFrames);
                });
            }

            // Add click listeners to the frame table rows to expand them
            _framesTbl = document.getElementById("frames");
            _framesTbl.addEventListener("click", e => {
                const resultRow = e.target.closest(".mp3-frame-result");
                if (resultRow !== null) {
                    const frameRow = document.getElementById(resultRow.dataset.controls);
                    $(frameRow).collapse("toggle");
                }
            });

            // Enable info popovers
            $(_framesTbl).popover({
                container: "body",
                html: true,
                trigger: "click hover focus",
                placement: "top",
                selector: "[data-toggle='popover']"
            });

            // Adjust visible columns as user changes display options
            const dllDispFields = document.getElementById("display-fields");
            dllDispFields.addEventListener("change", e=> {
                for (let f = 0; f < dllDispFields.length; ++f) {
                    const opt = dllDispFields[f];
                    if (opt.selected !== _fieldsShown[opt.value]) {
                        _fieldsShown[opt.value] = opt.selected;
                        const cells = Array.from(document.getElementsByClassName(`mp3-${opt.value}`));
                        for (let c = 0; c < cells.length; ++c)
                            cells[c].hidden = !opt.selected;
                    }
                }
            });

            // Get some other important UI elements
            _fileCtrls  = document.getElementById("file-ctrls");
            _loadingIcon = document.getElementById("loading-icon");
        }
        openMp3File(file, cb) {
            // Get the selected file
            _framesTbl.tBodies[0].innerHTML = "";

            // Open it with a FileReader
            const reader = new FileReader();
            reader.onload = e => {
                _file = reader.result;
                _filePos = 0;
                _frameNum = 0;

                _framesTbl.hidden = false;
                _fileCtrls.hidden = false;

                cb();
            };
            reader.onerror = e => {
                reader.abort();

                _framesTbl.hidden = true;
                _fileCtrls.hidden = true;

                alert(`Failed to load frames from file "${file.name}"!  ${e}`);
            };
            reader.readAsArrayBuffer(file);
        }
        loadFrames(numFrames) {
            _loadingIcon.hidden = false;
            document.body.style.cursor = "wait";

            // Wait 10ms so that UI changes show, and frame loading will happen asynchronously
            setTimeout(() => {
                doLoadFrames();
                _loadingIcon.hidden = true;
                document.body.style.cursor = "auto";
            }, 10);

            function doLoadFrames() {
                const dataView = new DataView(_file, _filePos);
                let start = 0;
                let html = "";
                for (let f = 0; f < numFrames; ++f) {
                    const frame = new Frame(dataView, start);
                    const hdrStrs = frame.getStringifiedHeader();
    
                    ++_frameNum;

                    // Build up the HTML for this MP3 Frame
                    let sectionsHtml = "";
                    sectionsHtml += getHeaderSectionHtml("text-white bg-success", "Sync", _sectionDescs["Sync"], "Synchronized", 0b11111111111);
                    sectionsHtml += getHeaderSectionHtml("text-white bg-info", "MPEG version ID", _sectionDescs["MPEG version ID"], hdrStrs.version, frame.header.version);
                    sectionsHtml += getHeaderSectionHtml("text-white bg-warning", "Layer", _sectionDescs["Layer"], hdrStrs.layer, frame.header.layer);
                    sectionsHtml += getHeaderSectionHtml("bg-light", "Protection bit", _sectionDescs["Protection bit"], hdrStrs.protected, frame.header.protected);
                    sectionsHtml += getHeaderSectionHtml("text-white bg-danger", "Bitrate", _sectionDescs["Bitrate"], hdrStrs.bitRate, frame.header.bitRate.index);
                    sectionsHtml += getHeaderSectionHtml("text-white bg-success", "Sample rate (frequency)", _sectionDescs["Sample rate (frequency)"], hdrStrs.sampleRate, frame.header.sampleRate.index);
                    sectionsHtml += getHeaderSectionHtml("bg-light", "Padding bit", _sectionDescs["Padding bit"], hdrStrs.padding, frame.header.padding);
                    sectionsHtml += getHeaderSectionHtml("bg-light", "Private bit", _sectionDescs["Private bit"], hdrStrs.private, frame.header.private);
                    sectionsHtml += getHeaderSectionHtml("text-white bg-info", "Channel mode", _sectionDescs["Channel mode"], hdrStrs.channelMode, frame.header.channelMode);
                    sectionsHtml += getHeaderSectionHtml("bg-light", "Copyright bit", _sectionDescs["Copyright bit"], hdrStrs.copyright, frame.header.copyright);
                    sectionsHtml += getHeaderSectionHtml("bg-light", "Home (original bit)", _sectionDescs["Home (original bit)"], hdrStrs.original, frame.header.original);
                    sectionsHtml += getHeaderSectionHtml("text-white bg-warning", "Emphasis", _sectionDescs["Emphasis"], hdrStrs.emphasis, frame.header.emphasis);
                    const frameHtml = `
                        <tr class="mp3-frame-result" data-controls="frame-${_frameNum}">
                            <td>#${_frameNum}</td>
                            <td class="mp3-version" ${_fieldsShown["version"] ? "" : "hidden"}>${hdrStrs.version}</td>
                            <td class="mp3-layer" ${_fieldsShown["layer"] ? "" : "hidden"}>${hdrStrs.layer}</td>
                            <td class="mp3-protected" ${_fieldsShown["protected"] ? "" : "hidden"}>${hdrStrs.protected}</td>
                            <td class="mp3-bitRate" ${_fieldsShown["bitRate"] ? "" : "hidden"}>${hdrStrs.bitRate}</td>
                            <td class="mp3-sampleRate" ${_fieldsShown["sampleRate"] ? "" : "hidden"}>${hdrStrs.sampleRate}</td>
                            <td class="mp3-padding" ${_fieldsShown["padding"] ? "" : "hidden"}>${hdrStrs.padding}</td>
                            <td class="mp3-private" ${_fieldsShown["private"] ? "" : "hidden"}>${hdrStrs.private}</td>
                            <td class="mp3-channelMode" ${_fieldsShown["channelMode"] ? "" : "hidden"}>${hdrStrs.channelMode}</td>
                            <td class="mp3-copyright" ${_fieldsShown["copyright"] ? "" : "hidden"}>${hdrStrs.copyright}</td>
                            <td class="mp3-original" ${_fieldsShown["original"] ? "" : "hidden"}>${hdrStrs.original}</td>
                            <td class="mp3-emphasis" ${_fieldsShown["emphasis"] ? "" : "hidden"}>${hdrStrs.emphasis}</td>
                        </tr>
                        <tr>
                            <td colspan="6" class="p-0">
                                <div id="frame-${_frameNum}" class="collapse row justify-content-center p-4">
                                    ${sectionsHtml}
                                </div>
                            </td>
                        </tr>
                    `;

                    // Add this HTML to the HTML for the entire sequence of frames that we're loading
                    html += frameHtml;
                    start += frame.frameSize;
                }

                // Add all the new HTML to the DOM and enable popovers
                _framesTbl.tBodies[0].innerHTML += html;
                _filePos += start;
            }
            function getHeaderSectionHtml(style, sectionName, sectionDesc, meaning, value) {
                return `
                    <div class="card ${style}">
                        <div class="card-header">
                            ${sectionName}
                            <a tabindex="0" role="button" class="${style} float-right" data-toggle="popover" title="${sectionName}" data-content="${sectionDesc}">
                                <i class="fas fa-info-circle ml-2"></i>
                            </a>
                        </div>
                        <ul class="list-group list-group-flush">
                            <li class="list-group-item bg-transparent" title="Meaning">${meaning}</li>
                            <li class="list-group-item bg-transparent" title="Binary value">${value.toString(2)}</li>
                            <li class="list-group-item bg-transparent" title="Hexadecimal value">0x${value.toString(16)}</li>
                            <li class="list-group-item bg-transparent" title="Decimal value">${value.toString(10)}</li>
                        </ul>
                    </div>
                `;
            }
        }

    }

    const page = new IndexPage();
    page.initialize();

});