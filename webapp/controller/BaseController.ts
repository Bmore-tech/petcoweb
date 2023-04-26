import Controller from "sap/ui/core/mvc/Controller";
import UIComponent from "sap/ui/core/UIComponent";
import AppComponent from "../Component";
import Model from "sap/ui/model/Model";
import ResourceModel from "sap/ui/model/resource/ResourceModel";
import ResourceBundle from "sap/base/i18n/ResourceBundle";
import Router from "sap/ui/core/routing/Router";
import History from "sap/ui/core/routing/History";
import XMLView from "sap/ui/core/mvc/XMLView";
import oCore from "sap/ui/core/Core";

/**
 * @namespace com.petco.portalproveedorespetco.controller
 */
export default abstract class BaseController extends Controller {

	public pathView = "com.petco.portalproveedorespetco.view.";

	/**
	 * Convenience method for accessing the component of the controller's view.
	 * @returns The component of the controller's view
	 */
	public getOwnerComponent(): AppComponent {
		return (super.getOwnerComponent() as AppComponent);
	}

	/**
	 * Convenience method to get the components' router instance.
	 * @returns The router instance
	 */
	public getRouter() : Router {
		return UIComponent.getRouterFor(this);
	}

	/**
	 * Convenience method for getting the i18n resource bundle of the component.
	 * @returns The i18n resource bundle of the component
	 */
	public getResourceBundle(): ResourceBundle | Promise<ResourceBundle> {
		const oModel = this.getOwnerComponent().getModel("i18n") as ResourceModel;
		return oModel.getResourceBundle();
	}

	/**
	 * Convenience method for getting the view model by name in every controller of the application.
	 * @param [sName] The model name
	 * @returns The model instance
	 */
	public getModel(sName?: string) : Model {
		return this.getView().getModel(sName);
	}

	/**
	 * Convenience method for setting the view model in every controller of the application.
	 * @param oModel The model instance
	 * @param [sName] The model name
	 * @returns The current base controller instance
	 */
	public setModel(oModel: Model, sName?: string) : BaseController {
		this.getView().setModel(oModel, sName);
		return this;
	}

	/**
	 * Convenience method for triggering the navigation to a specific target.
	 * @public
	 * @param sName Target name
	 * @param [oParameters] Navigation parameters
	 * @param [bReplace] Defines if the hash should be replaced (no browser history entry) or set (browser history entry)
	 */
	public navTo(sName: string, oParameters?: object, bReplace?: boolean) : void {
		this.getRouter().navTo(sName, oParameters, undefined, bReplace);
	}

	/**
	 * Convenience event handler for navigating back.
	 * It there is a history entry we go one step back in the browser history
	 * If not, it will replace the current entry of the browser history with the main route.
	 */
	public onNavBack(): void {
		const sPreviousHash = History.getInstance().getPreviousHash();
		if (sPreviousHash !== undefined) {
			window.history.go(-1);
		} else {
			this.getRouter().navTo("reception", {}, undefined, true);
		}
	}

	/**
	 * Method onToggleButtonPress for Expanded or Collapse Menu.
	 */
	public onToggleButtonPress = async (oEvent): Promise<void> => {
		const oToolPage = oEvent.getSource().getParent().getParent();
		const oSideNavigation = oToolPage.getAggregation('sideContent');
		const banderaExpanded : boolean = oSideNavigation.getExpanded();
		oSideNavigation.setExpanded(!banderaExpanded);
	}

	private async navToView(view: string, title: string, isBackButton: boolean) : Promise<void> {

		const viewContent = sap.ui.getCore().getModel("coreModel")?.containerView;
		const viewXMLContent = oCore.byId("viewXMLContent");

		if (viewXMLContent) {
			viewXMLContent.destroy();
		}

		const oView : XMLView = await XMLView.create({
			id: "viewXMLContent",
			viewName: `${this.pathView}${view}`
		});

		await viewContent.addContent(oView);


		const toolTitle = sap.ui.getCore().getModel("coreModel")?.toolTitle;
		if (title !== undefined) {
			const labelTitle = sap.ui.getCore().getModel("coreModel")?.labelTitle;
			toolTitle.setVisible(true);
			labelTitle.setText(title);
		} else {
			toolTitle.setVisible(false);
		}

		if (typeof isBackButton === "undefined") {

			const historyPath = sap.ui.getCore().getModel("historyPath");
			let listPages = [];
			
			if (historyPath) {
				listPages = [...historyPath.listPages];

			}

			listPages.push({
				view,
				title
			});


			sap.ui.getCore().setModel({
				listPages
			}, "historyPath");
		}

	}


	private async navToBack() : Promise<void> {

		debugger;
		
		const historyPath = sap.ui.getCore().getModel("historyPath");
		
		if (historyPath) {

			const listPages = [...historyPath.listPages];

			if (listPages.length > 0) {
				
				listPages.pop();
				const history = listPages[listPages.length -1];


				sap.ui.getCore().setModel({
					listPages
				}, "historyPath");

				this.navToView(history.view, history.title, true);
			}
		}
	}

}
