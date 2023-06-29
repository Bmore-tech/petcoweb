export interface InvoiceResponse {
	invoiceId: number;
	amount: number;
	applicationId: Number;
	apportionments: [{
		amount: number;
		subsidiaryId: Number;
	}]
	comments: [{
		comment: string;
		commentId: Number;
	}]
	concept: string
	conceptId: number;
	documents: [{
		applicationId: number;
		file: File
		fileName: string
		fileSize: string
		id: number
	}]
	folio: string
	generalConcept: string
}
