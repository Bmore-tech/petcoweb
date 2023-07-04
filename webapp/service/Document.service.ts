import { showMsgStrip } from "../component/MessageStrip.component";
import { MessageStripType } from "../model/MessageStripType";
import { ErrorResponse } from "../model/response/ErrorResponse";
import { Document } from "../model/response/InvoiceResponse";
import { SOLICITUDES_ENDPOINT, SOLICITUD_SERVICES } from "../properties/properties";
import { getJWT } from "../util/JwtHelper";
import { validatedErrorResponse } from "../util/Util";

export const getDocument = async (documentData: Document): Promise<Document> => {

    try {

        const jwt: string = await getJWT();
        const documentDataResponse: Response = await fetch(
            `${SOLICITUDES_ENDPOINT}${SOLICITUD_SERVICES.getDocument}/${documentData.id}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${jwt}`
                }
            }
        ).then((response) => response.blob())
            .then((myBlob) => {
                // URL.revokeObjectURL(href);
                documentData.file = myBlob;
            });
    } catch (e) {
        console.log(e);

        showMsgStrip("Error no se puede cargar la información del documento.", MessageStripType.ERROR);
    }

    return documentData;
}