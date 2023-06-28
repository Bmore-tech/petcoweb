import {Dashboard} from "../model/resquest/DashBoard";
import { showMsgStrip } from "../component/MessageStrip.component";
import {MessageStripType} from "../model/MessageStripType";
import {SOLICITUD_SERVICES, SOLICITUDES_ENDPOINT} from "../properties/properties";
import {getJWT} from "com/bmore/portalproveedores/util/JwtHelper";
import {ErrorResponse} from "com/bmore/portalproveedores/model/response/ErrorResponse";
import {validatedErrorResponse} from "com/bmore/portalproveedores/util/Util";


export const getDashBoard = async (): Promise<Dashboard> => {

    let dashBoardResponse: Dashboard;

    try {

		const jwt : string = await getJWT();
		const dashBoardDataResponse: Response = await fetch(
		`${SOLICITUDES_ENDPOINT}${SOLICITUD_SERVICES.dashboard}`,
		{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${jwt}`
				}
			}
		);

        if (dashBoardDataResponse.status == 200) {
            dashBoardResponse = await dashBoardDataResponse.json();
        } else {

            const dashBoardResponseError: ErrorResponse = await dashBoardDataResponse.json();

			await validatedErrorResponse(dashBoardDataResponse.status, dashBoardResponseError,
				"Error no se puede cargar la información en el dashboard.");
        }

    } catch (e) {
        showMsgStrip("Error no se puede cargar la información en el dashboard.", MessageStripType.ERROR);
    }

    return dashBoardResponse;
}
