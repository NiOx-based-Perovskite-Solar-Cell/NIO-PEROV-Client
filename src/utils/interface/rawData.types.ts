export interface RawDataSample {
    paper: string;
    sample: string;
    objectKey: string;
    data: Record<string, Record<string, unknown>[]>;
}

export interface RawDataPaper {
    paper: string;
    samples: RawDataSample[];
}
