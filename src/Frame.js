let Frame;

(() => {

    Frame = class {
        constructor(dataView, start) {
            // See this article for a great description of the MP3 format: https://www.mp3-tech.org/programmer/docs/mp3_theory.pdf

            // Make sure the frame is synced; if not, then just return
            let bits = dataView.getUint32(start);
            this.isSync        = (bits & 0b11111111111000000000000000000000) != 0;
            if (!this.isSync)
                return;

            // Parse frame header
            let hdr;
            this.header = hdr = {
                version:         (bits & 0b00000000000110000000000000000000) >> 19,
                layer:           (bits & 0b00000000000001100000000000000000) >> 17,
                protected:       (bits & 0b00000000000000010000000000000000) != 0,
                bitRate: {
                    index:       (bits & 0b00000000000000001111000000000000) >> 12,
                    value: undefined,
                },
                sampleRate: {
                    index:       (bits & 0b00000000000000000000110000000000) >> 10,
                    value: undefined,
                },
                padding:         (bits & 0b00000000000000000000001000000000) != 0,
                private:         (bits & 0b00000000000000000000000100000000) != 0,
                channelMode:     (bits & 0b00000000000000000000000011000000) >> 6,
                modeExtension: {
                    bits:        (bits & 0b00000000000000000000000000110000) >> 4,
                    intensityStereoOn: undefined,
                    msStereoOn: undefined
                },
                copyright:       (bits & 0b00000000000000000000000000001000) >> 3,
                original:        (bits & 0b00000000000000000000000000000100) >> 2,
                emphasis:        (bits & 0b00000000000000000000000000000011),
            };

            // Lookup the bit rate and sample rate from their respective indices
            hdr.bitRate.value = Frame.getBitrate(hdr.version, hdr.layer, hdr.bitRate.index);
            hdr.sampleRate.value = Frame.getSampleRate(hdr.version, hdr.sampleRate.index);

            // Set some channelMode-specific propertes
            this.isMono = (hdr.channelMode === Frame.ChannelMode.SingleChannel);
            if (hdr.channelMode === Frame.ChannelMode.JointStereo) {
                hdr.modeExtension.intensityStereoOn = (hdr.modeExtension.bits === 1 || hdr.modeExtension.bits === 3);
                hdr.modeExtension.msStereoOn        = (hdr.modeExtension.bits === 2 || hdr.modeExtension.bits === 3);
            }

            // Parse CRC, if the frame is protected
            this.crc = this.protected ? dataView.getUint16(start + 4) : null;

            // Parse side information
            const sideInfoStart = start + (this.protected ? 6 : 4);
            bits = dataView.getUint32(sideInfoStart);
            this.sideInfo = {
                mainDataBegin: (bits & 0b11111111100000000000000000000000) >> 23,
                scaleFactorSelectionInfo: this.isMono
                             ? (bits & 0b00000000000000111100000000000000) >> 14
                             : (bits & 0b00000000000011111111000000000000) >> 12
            };

            this.frameSize = Math.trunc(144 * 1000 * hdr.bitRate.value / hdr.sampleRate.value) + (hdr.padding ? 1 : 0);
        }
        static getBitrate(version, layer, bitrateIndex) {
            let bitrateArr = [];

            if (layer === Frame.Layer.I)
                bitrateArr = [ undefined, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448, undefined ];
            if (layer === Frame.Layer.II)
                bitrateArr = [ undefined, 32, 48, 56, 64 , 80 , 96 , 112, 128, 160, 192, 224, 256, 320, 384, undefined ];
            if (layer === Frame.Layer.III) {
                if (version === Frame.Version.MPEG1)
                    bitrateArr = [ undefined, 32, 40, 48, 56 , 64 , 80 , 96 , 112, 128, 160, 192, 224, 256, 320, undefined ];
                if (version !== Frame.Version.MPEG1)
                    bitrateArr = [ undefined, 8, 16, 24, 32 , 64 , 80 , 56 , 64 , 128, 160, 112, 128, 256, 320, undefined ];
            }

            return bitrateArr[bitrateIndex];
        }
        static getSampleRate(version, sampleRateIndex) {
            let sampleRateArr = [];

            if (version === Frame.Version.MPEG1)
                sampleRateArr = [ 44100, 48000, 32000, undefined ];
            if (version === Frame.Version.MPEG2)
                sampleRateArr = [ 22050, 24000, 16000, undefined ];
            if (version === Frame.Version.MPEG2_5)
                sampleRateArr = [ 11025, 12000, 8000,  undefined ];

            return sampleRateArr[sampleRateIndex];
        }
        getStringifiedHeader() {
            const hdr = this.header;

            // Stringify (most) header fields
            const hdrStrs = {
                version:       "?",
                layer:         "?",
                protected:     hdr.protected ? "true" : "false",
                bitRate:       `${hdr.bitRate.value.toLocaleString()} kbps`,
                sampleRate:    `${hdr.sampleRate.value.toLocaleString()} Hz`,
                padding:       hdr.padding ? "true" : "false",
                private:       hdr.private ? "true" : "false",
                channelMode:   "?",
                modeExtension: {
                    intensityStereoOn: "N/A",
                    msStereoOn: "N/A"
                },
                copyright:     hdr.copyright ? "true" : "false",
                original:      hdr.original ? "true" : "false",
                emphasis:      "?",
            };

            // Stringify MPEG Version
            if (hdr.version === Frame.Version.MPEG1)
                hdrStrs.version = "MPEG-1";
            else if (hdr.version === Frame.Version.MPEG2)
                hdrStrs.version = "MPEG-2";
            else if (hdr.version === Frame.Version.MPEG2_5)
                hdrStrs.version = "MPEG-2.5";

            // Stringify Layer
            if (hdr.layer === Frame.Layer.I)
                hdrStrs.layer = "Layer I";
            else if (hdr.layer === Frame.Layer.II)
                hdrStrs.layer = "Layer II";
            else if (hdr.layer === Frame.Layer.III)
                hdrStrs.layer = "Layer III";

            // Stringify Channel Mode
            if (hdr.channelMode === Frame.ChannelMode.Stereo)
                hdrStrs.channelMode = "Stereo";
            else if (hdr.channelMode === Frame.ChannelMode.JointStereo)
                hdrStrs.channelMode = "Joint stereo";
            else if (hdr.channelMode === Frame.ChannelMode.DualChannel)
                hdrStrs.channelMode = "Dual channel";
            else if (hdr.channelMode === Frame.ChannelMode.SingleChannel)
                hdrStrs.channelMode = "Single channel (mono)";

            // Stringify Mode Extensions
            if (!this.isMono) {
                hdrStrs.modeExtension.intensityStereoOn = hdr.modeExtension.intensityStereoOn ? "true" : "false";
                hdrStrs.modeExtension.msStereoOn = hdr.modeExtension.msStereoOn ? "true" : "false";
            }

            // Stringify Emphasis
            if (hdr.emphasis === Frame.Emphasis.None)
                hdrStrs.emphasis = "None";
            else if (hdr.emphasis === Frame.Emphasis.MS50_15)
                hdrStrs.emphasis = "50/15 ms";
            else if (hdr.emphasis === Frame.Emphasis.CCITT_J_17)
                hdrStrs.emphasis = "CCITT J.17";

            return hdrStrs;
        }
    }

    Frame.Version = {
        MPEG2_5 : 0,
        MPEG2: 2,
        MPEG1: 3
    };
    Frame.Layer = {
        III: 1,
        II: 2,
        I: 3,
    };
    Frame.ChannelMode = {
        Stereo: 0,
        JointStereo: 1,
        DualChannel: 2,
        SingleChannel: 3
    };
    Frame.Emphasis = {
        None: 0,
        MS50_15: 1,
        CCITT_J_17: 3
    };

})();