const FieldConfig = {
    sync: {
        header: "Sync",
        color: "success",
        description: "This is what 'Sync' means.",
        colSpan: 11,
        frameField: frame => frame.header.sync
    },
    version: {
        header: "MPEG version ID",
        color: "info",
        description: "This is what 'MPEG version ID' means.",
        colSpan: 2,
        frameField: frame => frame.header.version },
    layer: {
        header: "Layer",
        color: "info",
        description: "This is what 'Layer' means.",
        colSpan: 2,
        frameField: frame => frame.header.layer },
    protected: {
        header: "Protection bit",
        color: "secondary",
        description: "This is what 'Protection bit' means.",
        colSpan: 1,
        frameField: frame => frame.header.protected },
    bitRate: {
        header: "Bitrate",
        color: "info",
        description: "This is what 'Bitrate' means.",
        colSpan: 4,
        frameField: frame => frame.header.bitRate.index },
    sampleRate: {
        header: "Sample rate (frequency)",
        color: "info",
        description: "This is what 'Sample rate (frequency)' means.",
        colSpan: 2,
        frameField: frame => frame.header.sampleRate.index },
    padding: {
        header: "Padding bit",
        color: "secondary",
        description: "This is what 'Padding bit' means.",
        colSpan: 1,
        frameField: frame => frame.header.padding },
    private: {
        header: "Private bit",
        color: "secondary",
        description: "This is what 'Private bit' means.",
        colSpan: 1,
        frameField: frame => frame.header.private },
    channelMode: {
        header: "Channel mode",
        color: "info",
        description: "This is what 'Channel mode' means.",
        colSpan: 2,
        frameField: frame => frame.header.channelMode },
    intensityStereoOn: {
        header: "Intensity stereo",
        color: "secondary",
        description: "This is what 'Intensity stereo' means.",
        colSpan: 1,
        frameField: frame => frame.header.modeExtension.intensityStereoOn },
    msStereoOn: {
        header: "MS Stereo",
        color: "secondary",
        description: "This is what 'MS Stereo' means.",
        colSpan: 1,
        frameField: frame => frame.header.modeExtension.msStereoOn },
    copyright: {
        header: "Copyright",
        color: "secondary",
        description: "This is what 'Copyright' means.",
        colSpan: 1,
        frameField: frame => frame.header.copyright },
    original: {
        header: "Home (original bit)",
        color: "secondary",
        description: "This is what 'Home (original bit)' means.",
        colSpan: 1,
        frameField: frame => frame.header.original },
    emphasis: {
        header: "Emphasis",
        color: "info",
        description: "This is what 'Emphasis' means.",
        colSpan: 2,
        frameField: frame => frame.header.emphasis }
};