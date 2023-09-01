
import { InvisibleMessageMode, MessageType } from "sap/ui/core/library";
import InvisibleMessage from "sap/ui/core/InvisibleMessage";
import oCore from "sap/ui/core/Core";
import MessageStrip from "sap/m/MessageStrip";

const oInvisibleMessage = InvisibleMessage.getInstance();

export const showMsgStrip = async (mesaage: string, type: string): Promise<void> => {
    await closeMsgStrip();
    await generateMsgStrip(mesaage, type);
}

export const closeMsgStrip = async (): Promise<void> => {
    const oMessageStrip = oCore.byId("msgStrip");
    if (oMessageStrip) {
        oMessageStrip.destroy();
    }
}

const generateMsgStrip = async (mesaage: string, type: string): Promise<void> => {

    const sType = type;
    const messageType = mapToValidMessageType(type);
    const containerMessage = (sap.ui.getCore().getModel("coreModel") as any)?.oData.containerMessage;
    const oMessageStrip: MessageStrip = new MessageStrip("msgStrip", {
        text: mesaage,
        showCloseButton: true,
        showIcon: true,
        type: messageType
    });
    oInvisibleMessage.announce("New Information Bar of type " + sType + " " + mesaage, InvisibleMessageMode.Assertive);
    containerMessage.addItem(oMessageStrip);
    containerMessage.setVisible(true);
    //await setTimeout(containerMessage.removeItem(oMessageStrip), 10000);
}

// Función para mapear 'type' a un valor de MessageType válido
function mapToValidMessageType(type: string): MessageType {
    switch (type) {
        case 'Error':
            return MessageType.Error;
        case 'Information':
            return MessageType.Information;
        case 'None':
            return MessageType.None;
        case 'Success':
            return MessageType.Success;
        case 'Warning':
            return MessageType.Warning;
        default:
            return MessageType.Information; // Valor predeterminado si 'type' no coincide
    }
}