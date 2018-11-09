document.addEventListener("DOMContentLoaded", () => {

    let _file;
    let _filePos;
    let _frameNum;

    let _framesTbl;
    let _fileCtrls;

    let _loadingIcon;

    let _ddlFieldCols;
    const _fieldColsShown = {
        version: false,
        layer: false,
        protected: false,
        bitRate: false,
        sampleRate: false,
        padding: false,
        private: false,
        channelMode: false,
        intensityStereoOn: false,
        msStereoOn: false,
        copyright: false,
        original: false,
        emphasis: false
    }

    let _ddlValueRows;
    const _valRowsShown = {
        meaning: false,
        binary: false,
        hex: false,
        decimal: false
    }

    const _fieldColors = {
        sync: "success",
        version: "info",
        layer: "info",
        protected: "secondary",
        bitRate: "info",
        sampleRate: "info",
        padding: "secondary",
        private: "secondary",
        channelMode: "info",
        intensityStereoOn: "secondary",
        msStereoOn: "secondary",
        copyright: "secondary",
        original: "secondary",
        emphasis: "info"
    };
    const _fieldDescs = {
        sync: "This is what 'Sync' means.",
        version: "This is what 'MPEG version ID' means.",
        layer: "This is what 'Layer' means.",
        protected: "This is what 'Protection bit' means.",
        bitRate: "This is what 'Bitrate' means.",
        sampleRate: "This is what 'Sample rate (frequency)' means.",
        padding: "This is what 'Padding bit' means.",
        private: "This is what 'Private bit' means.",
        channelMode: "This is what 'Channel mode' means.",
        intensityStereoOn: "This is what 'Intensity stereo' means.",
        msStereoOn: "This is what 'MS stereo' means.",
        copyright: "This is what 'Mode extension' means.",
        original: "This is what 'Home (original bit)' means.",
        emphasis: "This is what 'Emphasis' means."
    }

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

            // Adjust visible columns of the result table as user changes options
            _ddlFieldCols = document.getElementById("display-field-cols");
            _ddlFieldCols.addEventListener("change", e => {
                this.resetFieldColumns();
            });

            // Adjust visible rows of the field tables as user changes options
            _ddlValueRows = document.getElementById("display-value-rows");
            _ddlValueRows.addEventListener("change", e => {
                this.resetValueRows();
            });

            // Add click listeners to the Restore Defaults button
            const btnDefaults = document.getElementById("btn-defaults");
            btnDefaults.addEventListener("click", e => {
                this.restoreDefaults();
            });

            // Toggle the fields that are displayed by default
            this.restoreDefaults();

            // Get some other important UI elements
            _fileCtrls  = document.getElementById("file-ctrls");
            _loadingIcon = document.getElementById("loading-icon");
        }
        restoreDefaults() {
            // Re-select default field columns
            _ddlFieldCols.namedItem("opt-version").selected = true;
            _ddlFieldCols.namedItem("opt-layer").selected = true;
            _ddlFieldCols.namedItem("opt-protected").selected = false;
            _ddlFieldCols.namedItem("opt-bitRate").selected = true;
            _ddlFieldCols.namedItem("opt-sampleRate").selected = true;
            _ddlFieldCols.namedItem("opt-padding").selected = false;
            _ddlFieldCols.namedItem("opt-private").selected = false;
            _ddlFieldCols.namedItem("opt-channelMode").selected = true;
            _ddlFieldCols.namedItem("opt-intensityStereoOn").selected = false;
            _ddlFieldCols.namedItem("opt-msStereoOn").selected = false;
            _ddlFieldCols.namedItem("opt-copyright").selected = false;
            _ddlFieldCols.namedItem("opt-original").selected = false;
            _ddlFieldCols.namedItem("opt-emphasis").selected = false;

            // Re-select default value rows
            _ddlValueRows.namedItem("opt-meaning").selected = true;
            _ddlValueRows.namedItem("opt-binary").selected = true;
            _ddlValueRows.namedItem("opt-hex").selected = false;
            _ddlValueRows.namedItem("opt-decimal").selected = false;

            // Reset displayed field columns and value rows accordingly
            this.resetFieldColumns();
            this.resetValueRows();
        }
        resetFieldColumns() {
            // Toggle field column visibility
            for (let c = 0; c < _ddlFieldCols.length; ++c) {
                const opt = _ddlFieldCols[c];
                if (opt.selected !== _fieldColsShown[opt.value]) {
                    _fieldColsShown[opt.value] = opt.selected;
                    const colCells = Array.from(document.getElementsByClassName(`mp3-${opt.value}`));
                    for (let c = 0; c < colCells.length; ++c)
                        colCells[c].hidden = !opt.selected;
                }
            }

            // Adjust column span of the table cell containing the field-values table
            const numColsShown = _ddlFieldCols.selectedOptions.length + 1;      // +1 for the always-present Frame # column
            const frameTbls = Array.from(document.getElementsByClassName("mp3-frame-tbl"));
            for (let t = 0; t < frameTbls.length; ++t) {
                const tbl = frameTbls[t];
                const td = tbl.closest("td");
                td.colSpan = numColsShown;
            }
        }
        resetValueRows() {
            for (let r = 0; r < _ddlValueRows.length; ++r) {
                const opt = _ddlValueRows[r];
                if (opt.selected !== _valRowsShown[opt.value]) {
                    _valRowsShown[opt.value] = opt.selected;
                    const rows = Array.from(document.getElementsByClassName(`mp3-${opt.value}`));
                    for (let c = 0; c < rows.length; ++c)
                        rows[c].hidden = !opt.selected;
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
                    const hdr = frame.header;
                    const hdrStrs = frame.getStringifiedHeader();
    
                    ++_frameNum;

                    // Build up the HTML for this MP3 Frame
                    const frameHtml = `
                        <tr class="mp3-frame-result" data-controls="frame-${_frameNum}">
                            <td>#${_frameNum}</td>
                            <td class="mp3-version"           ${_fieldColsShown.version            ? "" : "hidden"}>${hdrStrs.version}</td>
                            <td class="mp3-layer"             ${_fieldColsShown.layer              ? "" : "hidden"}>${hdrStrs.layer}</td>
                            <td class="mp3-protected"         ${_fieldColsShown.protected          ? "" : "hidden"}>${hdrStrs.protected}</td>
                            <td class="mp3-bitRate"           ${_fieldColsShown.bitRate            ? "" : "hidden"}>${hdrStrs.bitRate}</td>
                            <td class="mp3-sampleRate"        ${_fieldColsShown.sampleRate         ? "" : "hidden"}>${hdrStrs.sampleRate}</td>
                            <td class="mp3-padding"           ${_fieldColsShown.padding            ? "" : "hidden"}>${hdrStrs.padding}</td>
                            <td class="mp3-private"           ${_fieldColsShown.private            ? "" : "hidden"}>${hdrStrs.private}</td>
                            <td class="mp3-channelMode"       ${_fieldColsShown.channelMode        ? "" : "hidden"}>${hdrStrs.channelMode}</td>
                            <td class="mp3-intensityStereoOn" ${_fieldColsShown.intensityStereoOn  ? "" : "hidden"}>${hdrStrs.modeExtension.intensityStereoOn}</td>
                            <td class="mp3-msStereoOn"        ${_fieldColsShown.msStereoOn         ? "" : "hidden"}>${hdrStrs.modeExtension.msStereoOn}</td>
                            <td class="mp3-copyright"         ${_fieldColsShown.copyright          ? "" : "hidden"}>${hdrStrs.copyright}</td>
                            <td class="mp3-original"          ${_fieldColsShown.original           ? "" : "hidden"}>${hdrStrs.original}</td>
                            <td class="mp3-emphasis"          ${_fieldColsShown.emphasis           ? "" : "hidden"}>${hdrStrs.emphasis}</td>
                        </tr>
                        <tr>
                            <td colspan="6" class="p-0">
                                <div id="frame-${_frameNum}" class="mp3-frame-tbl collapse row justify-content-center py-4">
                                    <table class="table table-bordered text-white">
                                        <tr>
                                            <th scope="colgroup" colspan="11" class="d-none text-center text-monospace bg-${_fieldColors.sync}">Sync</th>
                                            <th scope="colgroup" colspan="2"  class="d-none text-center text-monospace bg-${_fieldColors.version}">MPEG Version ID</th>
                                            <th scope="colgroup" colspan="2"  class="d-none text-center text-monospace bg-${_fieldColors.layer}">Layer</th>
                                            <th scope="colgroup" colspan="1"  class="d-none text-center text-monospace bg-${_fieldColors.protected}">Protection bit</th>
                                            <th scope="colgroup" colspan="4"  class="d-none text-center text-monospace bg-${_fieldColors.bitRate}">Bitrate</th>
                                            <th scope="colgroup" colspan="2"  class="d-none text-center text-monospace bg-${_fieldColors.sampleRate}">Sample rate (frequency)</th>
                                            <th scope="colgroup" colspan="1"  class="d-none text-center text-monospace bg-${_fieldColors.padding}">Padding bit</th>
                                            <th scope="colgroup" colspan="1"  class="d-none text-center text-monospace bg-${_fieldColors.private}">Private bit</th>
                                            <th scope="colgroup" colspan="2"  class="d-none text-center text-monospace bg-${_fieldColors.channelMode}">Channel mode</th>
                                            <th scope="colgroup" colspan="1"  class="d-none text-center text-monospace bg-${_fieldColors.intensityStereoOn}">Intensity stereo</th>
                                            <th scope="colgroup" colspan="1"  class="d-none text-center text-monospace bg-${_fieldColors.msStereoOn}">MS stereo</th>
                                            <th scope="colgroup" colspan="1"  class="d-none text-center text-monospace bg-${_fieldColors.copyright}">Copyright bit</th>
                                            <th scope="colgroup" colspan="1"  class="d-none text-center text-monospace bg-${_fieldColors.original}">Home (original bit)</th>
                                            <th scope="colgroup" colspan="2"  class="d-none text-center text-monospace bg-${_fieldColors.emphasis}">Emphasis</th>
                                        </tr>
                                        <tr class="mp3-binary" ${_valRowsShown.binary ? "" : "hidden"}>
                                            <td class="text-center text-monospace bg-${_fieldColors.sync}">1</td>
                                            <td class="text-center text-monospace bg-${_fieldColors.sync}">1</td>
                                            <td class="text-center text-monospace bg-${_fieldColors.sync}">1</td>
                                            <td class="text-center text-monospace bg-${_fieldColors.sync}">1</td>
                                            <td class="text-center text-monospace bg-${_fieldColors.sync}">1</td>
                                            <td class="text-center text-monospace bg-${_fieldColors.sync}">1</td>
                                            <td class="text-center text-monospace bg-${_fieldColors.sync}">1</td>
                                            <td class="text-center text-monospace bg-${_fieldColors.sync}">1</td>
                                            <td class="text-center text-monospace bg-${_fieldColors.sync}">1</td>
                                            <td class="text-center text-monospace bg-${_fieldColors.sync}">1</td>
                                            <td class="text-center text-monospace bg-${_fieldColors.sync}">1</td>
                                            <td class="text-center text-monospace bg-${_fieldColors.version}">${hdr.version.toString(2)[0]}</td>
                                            <td class="text-center text-monospace bg-${_fieldColors.version}">${hdr.version.toString(2)[1]}</td>
                                            <td class="text-center text-monospace bg-${_fieldColors.layer}">${hdr.layer.toString(2).padStart(2, "0")[0]}</td>
                                            <td class="text-center text-monospace bg-${_fieldColors.layer}">${hdr.layer.toString(2).padStart(2, "0")[1]}</td>
                                            <td class="text-center text-monospace bg-${_fieldColors.protected}">${hdr.protected ? "1": "0"}</td>
                                            <td class="text-center text-monospace bg-${_fieldColors.bitRate}">${hdr.bitRate.index.toString(2)[0]}</td>
                                            <td class="text-center text-monospace bg-${_fieldColors.bitRate}">${hdr.bitRate.index.toString(2)[1]}</td>
                                            <td class="text-center text-monospace bg-${_fieldColors.bitRate}">${hdr.bitRate.index.toString(2)[2]}</td>
                                            <td class="text-center text-monospace bg-${_fieldColors.bitRate}">${hdr.bitRate.index.toString(2)[3]}</td>
                                            <td class="text-center text-monospace bg-${_fieldColors.sampleRate}">${hdr.sampleRate.index.toString(2).padStart(2, "0")[0]}</td>
                                            <td class="text-center text-monospace bg-${_fieldColors.sampleRate}">${hdr.sampleRate.index.toString(2).padStart(2, "0")[1]}</td>
                                            <td class="text-center text-monospace bg-${_fieldColors.padding}">${hdr.padding ? "1": "0"}</td>
                                            <td class="text-center text-monospace bg-${_fieldColors.private}">${hdr.private ? "1": "0"}</td>
                                            <td class="text-center text-monospace bg-${_fieldColors.channelMode}">${hdr.channelMode.toString(2).padStart(2, "0")[0]}</td>
                                            <td class="text-center text-monospace bg-${_fieldColors.channelMode}">${hdr.channelMode.toString(2).padStart(2, "0")[1]}</td>
                                            <td class="text-center text-monospace bg-${_fieldColors.intensityStereoOn}">${hdr.modeExtension.intensityStereoOn ? "1" : "0"}</td>
                                            <td class="text-center text-monospace bg-${_fieldColors.msStereoOn}">${hdr.modeExtension.msStereoOn ? "1" : "0"}</td>
                                            <td class="text-center text-monospace bg-${_fieldColors.copyright}">${hdr.copyright ? "1": "0"}</td>
                                            <td class="text-center text-monospace bg-${_fieldColors.original}">${hdr.original ? "1": "0"}</td>
                                            <td class="text-center text-monospace bg-${_fieldColors.emphasis}">${hdr.emphasis.toString(2).padStart(2, "0")[0]}</td>
                                            <td class="text-center text-monospace bg-${_fieldColors.emphasis}">${hdr.emphasis.toString(2).padStart(2, "0")[1]}</td>
                                        </tr>
                                        <tr class="mp3-meaning" ${_valRowsShown.meaning ? "" : "hidden"}>
                                            <td colspan="11" class="text-center text-monospace bg-${_fieldColors.sync}">Synchronized</td>
                                            <td colspan="2"  class="text-center text-monospace bg-${_fieldColors.version}">${hdrStrs.version}</td>
                                            <td colspan="2"  class="text-center text-monospace bg-${_fieldColors.layer}">${hdrStrs.layer}</td>
                                            <td colspan="1"  class="text-center text-monospace bg-${_fieldColors.protected}">${hdrStrs.protected}</td>
                                            <td colspan="4"  class="text-center text-monospace bg-${_fieldColors.bitRate}">${hdrStrs.bitRate}</td>
                                            <td colspan="2"  class="text-center text-monospace bg-${_fieldColors.sampleRate}">${hdrStrs.sampleRate}</td>
                                            <td colspan="1"  class="text-center text-monospace bg-${_fieldColors.padding}">${hdrStrs.padding}</td>
                                            <td colspan="1"  class="text-center text-monospace bg-${_fieldColors.private}">${hdrStrs.private}</td>
                                            <td colspan="2"  class="text-center text-monospace bg-${_fieldColors.channelMode}">${hdrStrs.channelMode}</td>
                                            <td colspan="1"  class="text-center text-monospace bg-${_fieldColors.intensityStereoOn}">${hdrStrs.modeExtension.intensityStereoOn}</td>
                                            <td colspan="1"  class="text-center text-monospace bg-${_fieldColors.msStereoOn}">${hdrStrs.modeExtension.msStereoOn}</td>
                                            <td colspan="1"  class="text-center text-monospace bg-${_fieldColors.copyright}">${hdrStrs.copyright}</td>
                                            <td colspan="1"  class="text-center text-monospace bg-${_fieldColors.original}">${hdrStrs.original}</td>
                                            <td colspan="2"  class="text-center text-monospace bg-${_fieldColors.emphasis}">${hdrStrs.emphasis}</td>
                                        </tr>
                                        <tr class="mp3-hex" ${_valRowsShown.hex ? "" : "hidden"}>
                                            <td colspan="11" class="text-center text-monospace bg-${_fieldColors.sync}">0x7FF</td>
                                            <td colspan="2"  class="text-center text-monospace bg-${_fieldColors.version}">0x${hdr.version.toString(16)}</td>
                                            <td colspan="2"  class="text-center text-monospace bg-${_fieldColors.layer}">0x${hdr.layer.toString(16)}</td>
                                            <td colspan="1"  class="text-center text-monospace bg-${_fieldColors.protected}">0x${hdr.protected ? "1" : "0"}</td>
                                            <td colspan="4"  class="text-center text-monospace bg-${_fieldColors.bitRate}">0x${hdr.bitRate.index.toString(16)}</td>
                                            <td colspan="2"  class="text-center text-monospace bg-${_fieldColors.sampleRate}">0x${hdr.sampleRate.index.toString(16)}</td>
                                            <td colspan="1"  class="text-center text-monospace bg-${_fieldColors.padding}">0x${hdr.padding ? "1" : "0"}</td>
                                            <td colspan="1"  class="text-center text-monospace bg-${_fieldColors.private}">0x${hdr.private ? "1" : "0"}</td>
                                            <td colspan="2"  class="text-center text-monospace bg-${_fieldColors.channelMode}">0x${hdr.channelMode.toString(16)}</td>
                                            <td colspan="1"  class="text-center text-monospace bg-${_fieldColors.intensityStereoOn}">0x${hdr.modeExtension.intensityStereoOn ? "1" : "0"}</td>
                                            <td colspan="1"  class="text-center text-monospace bg-${_fieldColors.msStereoOn}">0x${hdr.modeExtension.msStereoOn ? "1" : "0"}</td>
                                            <td colspan="1"  class="text-center text-monospace bg-${_fieldColors.copyright}">0x${hdr.copyright ? "1" : "0"}</td>
                                            <td colspan="1"  class="text-center text-monospace bg-${_fieldColors.original}">0x${hdr.original ? "1" : "0"}</td>
                                            <td colspan="2"  class="text-center text-monospace bg-${_fieldColors.emphasis}">0x${hdr.emphasis.toString(16)}</td>
                                        </tr>
                                        <tr class="mp3-decimal" ${_valRowsShown.decimal ? "" : "hidden"}>
                                            <td colspan="11" class="text-center text-monospace bg-${_fieldColors.sync}">2047</td>
                                            <td colspan="2"  class="text-center text-monospace bg-${_fieldColors.version}">${hdr.version.toString(10)}</td>
                                            <td colspan="2"  class="text-center text-monospace bg-${_fieldColors.layer}">${hdr.layer.toString(10)}</td>
                                            <td colspan="1"  class="text-center text-monospace bg-${_fieldColors.protected}">${hdr.protected ? "1" : "0"}</td>
                                            <td colspan="4"  class="text-center text-monospace bg-${_fieldColors.bitRate}">${hdr.bitRate.index.toString(10)}</td>
                                            <td colspan="2"  class="text-center text-monospace bg-${_fieldColors.sampleRate}">${hdr.sampleRate.index.toString(10)}</td>
                                            <td colspan="1"  class="text-center text-monospace bg-${_fieldColors.padding}">${hdr.padding ? "1" : "0"}</td>
                                            <td colspan="1"  class="text-center text-monospace bg-${_fieldColors.private}">${hdr.private ? "1" : "0"}</td>
                                            <td colspan="2"  class="text-center text-monospace bg-${_fieldColors.channelMode}">${hdr.channelMode.toString(10)}</td>
                                            <td colspan="1"  class="text-center text-monospace bg-${_fieldColors.intensityStereoOn}">${hdr.modeExtension.intensityStereoOn ? "1" : "0"}</td>
                                            <td colspan="1"  class="text-center text-monospace bg-${_fieldColors.msStereoOn}">${hdr.modeExtension.msStereoOn ? "1" : "0"}</td>
                                            <td colspan="1"  class="text-center text-monospace bg-${_fieldColors.copyright}">${hdr.copyright ? "1" : "0"}</td>
                                            <td colspan="1"  class="text-center text-monospace bg-${_fieldColors.original}">${hdr.original ? "1" : "0"}</td>
                                            <td colspan="2"  class="text-center text-monospace bg-${_fieldColors.emphasis}">${hdr.emphasis.toString(10)}</td>
                                        </tr>
                                    </table>
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
        }

    }

    const page = new IndexPage();
    page.initialize();

});