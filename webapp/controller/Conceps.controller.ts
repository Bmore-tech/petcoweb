import MessageBox from "sap/m/MessageBox";
import BaseController from "./BaseController";
import formatter from "../model/formatter";

/**
 * @namespace com.petco.portalproveedorespetco.controller
 */
export default class Conceps extends BaseController {
    private formatter = formatter;

    public sayHello() : void {
        MessageBox.show("Hello World!");
    }

}

