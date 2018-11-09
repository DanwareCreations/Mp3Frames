document.addEventListener("DOMContentLoaded", () => {

    let _file;
    let _filePos;
    let _frameNum;

    let _framesTbl;
    let _fileCtrls;

    let _loadingIcon;

    let _ddlFieldCols;
    let _ddlValueRows;

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
    };
    const _valRowsShown = {
        meaning: false,
        binary: false,
        hex: false,
        decimal: false
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


                    let resultHdrs = `<td>#${_frameNum}</td>`;
                    let valColHdrs = "";
                    let valMeaningCells = "";
                    let binaryValCells = "";
                    let hexValCells = "";
                    let decimalValCells = "";
                    for (let fieldName in FieldConfig) {
                        resultHdrs += `<td class="mp3-${fieldName}"${_fieldColsShown[fieldName] ? "" : "hidden"}>${hdrStrs[fieldName]}</td>`;
                        valColHdrs += `
                            <th scope="colgroup" colspan="${FieldConfig[fieldName].colSpan}" class="text-center text-monospace bg-${FieldConfig[fieldName].color}">
                                ${FieldConfig[fieldName].header}
                                <a tabindex="0" role="button" class="text-white float-right" data-toggle="popover" title="${FieldConfig[fieldName].header}" data-content="${FieldConfig[fieldName].description}"> 
                                    <i class="fas fa-info-circle ml-2"></i>
                                </a> 
                            </th>
                        `;
                        valMeaningCells += `<td colspan="${FieldConfig[fieldName].colSpan}" class="text-center text-monospace bg-${FieldConfig[fieldName].color}">${hdrStrs[fieldName]}</td>`;
                        const val = FieldConfig[fieldName].frameField(frame);
                        const binaryStr = ((typeof(val) === "boolean") ? (val ? 1 : 0) : val).toString(2).padStart(FieldConfig[fieldName].colSpan, "0");
                        for (let c = 0; c < binaryStr.length; ++c)
                            binaryValCells += `<td class="text-center text-monospace bg-${FieldConfig[fieldName].color}">${binaryStr[c]}</td>`;
                        const hexStr = ((typeof(val) === "boolean") ? (val ? 1 : 0) : val).toString(16);
                        hexValCells += `<td colspan="${FieldConfig[fieldName].colSpan}" class="text-center text-monospace bg-${FieldConfig[fieldName].color}">0x${hexStr}</td>`;
                        const decimalStr = ((typeof(val) === "boolean") ? (val ? 1 : 0) : val).toString();
                        decimalValCells += `<td colspan="${FieldConfig[fieldName].colSpan}" class="text-center text-monospace bg-${FieldConfig[fieldName].color}">${decimalStr}</td>`;
                    }

                    // Build up the HTML for this MP3 Frame
                    const frameHtml = `
                        <tr class="mp3-frame-result" data-controls="frame-${_frameNum}">${resultHdrs}</tr>
                        <tr>
                            <td colspan="6" class="p-0">
                                <div id="frame-${_frameNum}" class="mp3-frame-tbl collapse row justify-content-center py-4">
                                    <table class="table table-bordered text-white">
                                        <tr>${valColHdrs}</tr>
                                        <tr class="mp3-binary" ${_valRowsShown.binary ? "" : "hidden"}>${binaryValCells}</tr>
                                        <tr class="mp3-meaning" ${_valRowsShown.meaning ? "" : "hidden"}>${valMeaningCells}</tr>
                                        <tr class="mp3-hex" ${_valRowsShown.hex ? "" : "hidden"}>${hexValCells}</tr>
                                        <tr class="mp3-decimal" ${_valRowsShown.decimal ? "" : "hidden"}>${decimalValCells}</tr>
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