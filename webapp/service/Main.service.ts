import {Dashboard} from "../model/resquest/DashBoard";
import { showMsgStrip } from "../component/MessageStrip.component";
import {MessageStripType} from "../model/MessageStripType";
import {SOLICITUD_SERVICES, SOLICITUDES_ENDPOINT} from "../properties/properties";
import {getJWT} from "com/bmore/portalproveedores/util/JwtHelper";


export const getDashBoard = async (): Promise<Dashboard> => {

    let dashBoardResponse: Dashboard;

    try {

		const jwt : string = await getJWT();
		const dashBoardDataRequest: Response = await fetch(
		`${SOLICITUDES_ENDPOINT}${SOLICITUD_SERVICES.dashboard}`,
		{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${jwt}`
				}
			}
		);

        if (dashBoardDataRequest.status == 200) {
            dashBoardResponse = await dashBoardDataRequest.json();
        } else {

            const dashBoardResponseError : any  = dashBoardResponse = await dashBoardDataRequest.json();
            console.log(dashBoardDataRequest)
            if (dashBoardDataRequest.status >= 500) {
                showMsgStrip("Error no se puede cargar la información en el dashboard.", MessageStripType.ERROR);
            } else {
                showMsgStrip(dashBoardResponseError.mensaje, MessageStripType.WARNING);
            }
        }

        console.log(dashBoardResponse);
    } catch (e) {
        console.log(e);
        showMsgStrip("Error no se puede cargar la información en el dashboard.", MessageStripType.ERROR);
    }

    return dashBoardResponse;
}
