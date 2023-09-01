import {Apportionment} from "com/bmore/portalproveedores/model/resquest/Apportionment";
import {Comment} from "com/bmore/portalproveedores/model/resquest/Comment";

export interface Invoice {
	amount:         number;
	applicationId:  string;
	apportionments: Apportionment[];
	comment:        Comment;
	conceptId:      number;
	folio:          string;
	generalConcept: string;
	uuid: 			string;
}

export interface InvoiceToApprove {
	applicationId:  Number;
	comment:        Comment;
}
