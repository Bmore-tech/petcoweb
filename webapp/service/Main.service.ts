import {Dashboard} from "../model/DashBoard";
import { showMsgStrip } from "../component/MessageStrip.component";
import {MessageStripType} from "../model/MessageStripType";
import {SOLICITUD_SERVICES, URL_ENDPOINT_SERVICES} from "../properties/properties";

export const getDashBoard = async (): Promise<Dashboard> => {

    let dashBoardResponse: Dashboard;

    try {

        const dashBoardDataRequest = await fetch(`${URL_ENDPOINT_SERVICES}${SOLICITUD_SERVICES.dashboard}`);

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
