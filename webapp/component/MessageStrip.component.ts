
import {InvisibleMessageMode} from "sap/ui/core/library";
import InvisibleMessage from "sap/ui/core/InvisibleMessage";
import oCore from "sap/ui/core/Core";
import MessageStrip from "sap/m/MessageStrip";

const oInvisibleMessage = InvisibleMessage.getInstance();

export const showMsgStrip = (mesaage : string, type: string) => {

    const oMessageStrip = oCore.byId("msgStrip");
    if (oMessageStrip) {
        oMessageStrip.destroy();
    }

    generateMsgStrip(mesaage, type);
}

const generateMsgStrip = (mesaage : string, type: string) => {

    const sType = type;
    const containerMessage = sap.ui.getCore().getModel("coreModel")?.containerMessage;
    const oMessageStrip = new MessageStrip("msgStrip", {
        text: mesaage,
        showCloseButton: true,
        showIcon: true,
        type
    });

    oInvisibleMessage.announce("New Information Bar of type " + sType + " " + mesaage, InvisibleMessageMode.Assertive);
    containerMessage.addContent(oMessageStrip);
    containerMessage.setVisible(true);
}


