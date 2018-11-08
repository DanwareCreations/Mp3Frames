let Frame;

(() => {

    Frame = class {
        constructor(dataView, start) {
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
                bitRateIndex :   (bits & 0b00000000000000001111000000000000) >> 12,
                sampleRateIndex: (bits & 0b00000000000000000000110000000000) >> 10,
                padding:         (bits & 0b00000000000000000000001000000000) != 0,
                private:         (bits & 0b00000000000000000000000100000000) != 0,
                channelMode:     (bits & 0b00000000000000000000000011000000) >> 6,
                modeExtension:   (bits & 0b00000000000000000000000000110000) >> 4,
                copyright:       (bits & 0b00000000000000000000000000001000) >> 3,
                original:        (bits & 0b00000000000000000000000000000100) >> 2,
                emphasis:        (bits & 0b00000000000000000000000000000011),
            };

            // Lookup the bit rate and sample rate from their respective indices
            this.bitRate = Frame.getBitrate(hdr.version, hdr.layer, hdr.bitRateIndex);
            this.sampleRate = Frame.getSampleRate(hdr.version, hdr.sampleRateIndex);

            // Set some channelMode-specific propertes
            this.isMono = (hdr.channelMode === Frame.ChannelMode.SingleChannel);
            this.intensityStereoOn = (hdr.channelMode === Frame.ChannelMode.JointStereo) ? (hdr.modeExtension === 1 || hdr.modeExtension === 3) : undefined;
            this.msStereoOn        = (hdr.channelMode === Frame.ChannelMode.JointStereo) ? (hdr.modeExtension === 2 || hdr.modeExtension === 3) : undefined;

            // Parse CRC, if the frame is protected
            this.crc = this.protected ? dataView.getUint16(start + 4) : null;

            // Parse side information
            const isMono = this.channelMode === 3;
            const sideInfoStart = start + (this.protected ? 6 : 4);
            bits = dataView.getUint32(sideInfoStart);
            this.sideInfo = {
                mainDataBegin: (bits & 0b11111111100000000000000000000000) >> 23,
                scaleFactorSelectionInfo: isMono
                             ? (bits & 0b00000000000000111100000000000000) >> 14
                             : (bits & 0b00000000000011111111000000000000) >> 12
            };

            this.frameSize = 144 * this.bitRate / (this.sampleRate + (this.padding ? 1 : 0));
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