document.addEventListener("DOMContentLoaded", () => {

    let _file;
    let _filePos;
    let _frameNum;

    let _framesTbl;
    let _fileCtrls;

    let _loadingIcon;

    let _ddlDisplayFields;
    let _fieldsShown = {
        version: false,
        layer: false,
        protected: false,
        bitRate: false,
        sampleRate: false,
        padding: false,
        private: false,
        channelMode: false,
        copyright: false,
        original: false,
        emphasis: false,
    }

    const _fieldDescs = {
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
            _ddlDisplayFields = document.getElementById("display-fields");
            _ddlDisplayFields.addEventListener("change", e => {
                this.resetDisplayedFields(_ddlDisplayFields);
            });

            // Add click listeners to the Restore Defaults button
            const btnDefaults = document.getElementById("btn-defaults");
            btnDefaults.addEventListener("click", e => {
                this.restoreDefaults();
                this.resetDisplayedFields();
            });

            // Toggle the fields that are displayed by default
            this.restoreDefaults();
            this.resetDisplayedFields();

            // Get some other important UI elements
            _fileCtrls  = document.getElementById("file-ctrls");
            _loadingIcon = document.getElementById("loading-icon");
        }
        restoreDefaults() {
            _ddlDisplayFields.namedItem("opt-version").selected = true;
            _ddlDisplayFields.namedItem("opt-layer").selected = true;
            _ddlDisplayFields.namedItem("opt-protected").selected = false;
            _ddlDisplayFields.namedItem("opt-bitRate").selected = true;
            _ddlDisplayFields.namedItem("opt-sampleRate").selected = true;
            _ddlDisplayFields.namedItem("opt-padding").selected = false;
            _ddlDisplayFields.namedItem("opt-private").selected = false;
            _ddlDisplayFields.namedItem("opt-channelMode").selected = true;
            _ddlDisplayFields.namedItem("opt-copyright").selected = false;
            _ddlDisplayFields.namedItem("opt-original").selected = false;
            _ddlDisplayFields.namedItem("opt-emphasis").selected = false;
        }
        resetDisplayedFields() {
            for (let f = 0; f < _ddlDisplayFields.length; ++f) {
                const opt = _ddlDisplayFields[f];
                if (opt.selected !== _fieldsShown[opt.value]) {
                    _fieldsShown[opt.value] = opt.selected;
                    const cells = Array.from(document.getElementsByClassName(`mp3-${opt.value}`));
                    for (let c = 0; c < cells.length; ++c)
                        cells[c].hidden = !opt.selected;
                }
            }
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
                    let fieldsHtml = "";
                    fieldsHtml += getHeaderFieldHtml("text-white bg-success", "Sync", _fieldDescs["Sync"], "Synchronized", 0b11111111111);
                    fieldsHtml += getHeaderFieldHtml("text-white bg-info", "MPEG version ID", _fieldDescs["MPEG version ID"], hdrStrs.version, frame.header.version);
                    fieldsHtml += getHeaderFieldHtml("text-white bg-warning", "Layer", _fieldDescs["Layer"], hdrStrs.layer, frame.header.layer);
                    fieldsHtml += getHeaderFieldHtml("bg-light", "Protection bit", _fieldDescs["Protection bit"], hdrStrs.protected, frame.header.protected);
                    fieldsHtml += getHeaderFieldHtml("text-white bg-danger", "Bitrate", _fieldDescs["Bitrate"], hdrStrs.bitRate, frame.header.bitRate.index);
                    fieldsHtml += getHeaderFieldHtml("text-white bg-success", "Sample rate (frequency)", _fieldDescs["Sample rate (frequency)"], hdrStrs.sampleRate, frame.header.sampleRate.index);
                    fieldsHtml += getHeaderFieldHtml("bg-light", "Padding bit", _fieldDescs["Padding bit"], hdrStrs.padding, frame.header.padding);
                    fieldsHtml += getHeaderFieldHtml("bg-light", "Private bit", _fieldDescs["Private bit"], hdrStrs.private, frame.header.private);
                    fieldsHtml += getHeaderFieldHtml("text-white bg-info", "Channel mode", _fieldDescs["Channel mode"], hdrStrs.channelMode, frame.header.channelMode);
                    fieldsHtml += getHeaderFieldHtml("bg-light", "Copyright bit", _fieldDescs["Copyright bit"], hdrStrs.copyright, frame.header.copyright);
                    fieldsHtml += getHeaderFieldHtml("bg-light", "Home (original bit)", _fieldDescs["Home (original bit)"], hdrStrs.original, frame.header.original);
                    fieldsHtml += getHeaderFieldHtml("text-white bg-warning", "Emphasis", _fieldDescs["Emphasis"], hdrStrs.emphasis, frame.header.emphasis);
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
                                    ${fieldsHtml}
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
            function getHeaderFieldHtml(style, fieldName, fieldDesc, meaning, value) {
                return `
                    <div class="card ${style}">
                        <div class="card-header">
                            ${fieldName}
                            <a tabindex="0" role="button" class="${style} float-right" data-toggle="popover" title="${fieldName}" data-content="${fieldDesc}">
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