
const URL_ENDPOINT : string = "http://localhost:8080";
const VERSION_ENDPOINT : string = "-1.0.0"; // para prod es vacio

export const SECURITY_ENDPOINT : string = `${URL_ENDPOINT}/MSV-PETCO-SECURITY${VERSION_ENDPOINT}/api/petco/security`;
export const SOLICITUDES_ENDPOINT : string = `${URL_ENDPOINT}/MSV-PETCO-SOLICITUDES${VERSION_ENDPOINT}/api/petco/solicitudes`;

export const SECURITY_SERVICES: { [name: string]: string } = {
	login: "/user/login"
}

export const SOLICITUD_SERVICES: { [name: string]: string } = {
    dashboard: "/dashboard",
	subsidiary : "/subsidiary",
	concep: "/concept",
	saveInvoice: "/invoice/saveDraft",
	getInvoice : "/invoice",
	sendInvoice: "/invoice/saveProvider",
	getInfoXml: "/document/getInfoXml",
	getProrrateoXlsx: "/document/getProrrateo",
	invoiceHistory: "/invoice/history",
	getDocument: "/document",
	prevalidateInvoice: "/invoice/sendPrevalidator",
	cancelPrevalidator: "/invoice/cancelPrevalidator",
	approveInvoice: "/invoice/sendApprover",
	cancelApprove: "/invoice/cancelApprover"
}