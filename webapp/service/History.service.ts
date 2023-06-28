import { History } from "com/bmore/portalproveedores/model/response/History";
import { getJWT } from "../util/JwtHelper";
import { SOLICITUDES_ENDPOINT, SOLICITUD_SERVICES } from "../properties/properties";
import { ErrorResponse } from "../model/response/ErrorResponse";
import { validatedErrorResponse } from "../util/Util";
import { showMsgStrip } from "../component/MessageStrip.component";
import { MessageStripType } from "../model/MessageStripType";

export const getHistory = async (): Promise<History[]> => {
    let historyResponse: History[];

    try {

        const jwt: string = await getJWT();
        const historyDataResponse: Response = await fetch(
            `${SOLICITUDES_ENDPOINT}${SOLICITUD_SERVICES.invoiceHistory}/ALL`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwt}`
                }
            }
        );

        if (historyDataResponse.status == 200) {
            historyResponse = await historyDataResponse.json();
        } else {

            const subsidiaryResponseError: ErrorResponse = await historyDataResponse.json();

            await validatedErrorResponse(historyDataResponse.status, subsidiaryResponseError,
                "Error no se puede cargar la información de las sucursales.");
        }
    } catch (e) {
        showMsgStrip("Error no se puede cargar la información de las sucursales.", MessageStripType.ERROR);
    }

    return historyResponse;

}