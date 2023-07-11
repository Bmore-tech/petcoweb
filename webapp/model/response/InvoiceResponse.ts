export interface InvoiceResponse {
    amount:         number;
    applicationId:  number;
    apportionments: Apportionment[];
    comments:       Comment[];
    concept:        string; 
    conceptId:      number;
    documents:      Document[];
    folio:          string;
    generalConcept: string;
	status:         string;
}

export interface Apportionment {
    amount:       number;
    subsidiaryId: number;
	subsidiary:   string;
}

export interface Comment {
    comment:   string;
    commentId: number;
}

export interface Document {
    applicationId: number;
    file:          Blob;
    fileName:      string;
    fileSize:      string;
    id:            number;
}

