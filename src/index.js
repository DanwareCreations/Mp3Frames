document.addEventListener("DOMContentLoaded", () => {

    const fileInput = document.getElementById("file-input");
    fileInput.addEventListener("change", () => readMp3File());

    const framesList = document.getElementById("frames");

    function readMp3File() {
        const selectedFile = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = e => {
            framesList.innerHTML = "";

            const dataView = new DataView(reader.result);
            let start = 0;
            for (let f = 0; f < 1000; ++f) {
                const frame = new Frame(dataView, start);
                const header = frame.header;
                // byteStrs = [ ...Array(4).keys() ].map(b => dataView.getUint8(b).toString(2).padStart(8, "0"));
                framesList.innerHTML += `
                    <li id="frame${f}">
                        <span>MPEG Version: ${header.version}</span> |
                        <span>Layer: ${header.layer}</span> |
                        <span>Bitrate index: ${header.bitRateIndex} (${frame.bitRate} bps)</span> |
                        <span>Sample rate index: ${header.sampleRateIndex} (${frame.sampleRate} Hz)</span> |
                        <span>Channel mode: ${header.channelMode}</span>
                    </li>
                `;
                start += frame.frameSize;
            }
        };
        reader.onerror = e => {
            reader.abort();
            alert(`Failed to read file "${selectedFile.name}"!  ${e}`);
        };
        reader.readAsArrayBuffer(selectedFile);
    }

});