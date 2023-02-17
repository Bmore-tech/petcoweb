sap.ui.define(
	[
		"com/bmore/inveweb/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"sap/ui/core/Fragment",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/m/MessageBox",
		"sap/ui/core/BusyIndicator",
	],
	function (BaseController, JSONModel,Fragment, Filter, FilterOperator, MessageBox, BusyIndicator) {
		"use strict";

		return BaseController.extend("com.bmore.inveweb.controller.vConciliacionFrescura", {
			onInit: function () {
				
			},
			showMCFreshDocInv:function(){
				let oView = this.getView();
				if (!this.byId("oDialogFreshDoc")) {
					Fragment.load({
						id: oView.getId(),
						name: "com.bmore.inveweb.view.fragments.vMCFrescuraDoc",
						controller: this
					}).then(function (oDialog) {
						oView.addDependent(oDialog);
						this.frgById("oTable").setModel(new JSONModel([]),"oModel");
						oDialog.open();
						oDialog.addStyleClass("sapUiSizeCompact");
					}.bind(this));
				} else {
					this.frgById("oTable").setModel(new JSONModel([]),"oModel");
					this.byId("oDialogFreshDoc").open();
					this.byId("oDialogFreshDoc").addStyleClass("sapUiSizeCompact");
				}
			},
			_closeDialog:function(){
				this.byId("oDialogFreshDoc").close();
			},
			frgById: function(id){

				return Fragment.byId(this.getView().getId(),id);
			},
			cleanOdialog: function(){
		
				this.frgById("fSearch").setValue("");			
				//this.frgById("oTable").setModel(new JSONModel([]),"oModel");
			},
			getDocsIdsFresh:async function(oEvent){

				if(oEvent != undefined){
					let clear = oEvent.getParameters().clearButtonPressed;
					
					if(clear){
						this.cleanOdialog();
						return;
					}
				}
						
				let oModel = new JSONModel([]);			
				let oTable = this.frgById("oTable");	
				oTable.setModel(oModel,"oModel");
				
				let search = this.frgById("fSearch").getValue();
				
				if(search.trim().length > 0 && isNaN(search)){
					MessageBox.show('El formato del Id es inválido.',MessageBox.Icon.ERROR, "Error");
					return;
				}		
				BusyIndicator.show(0);
				let bukrs = null;
				let werks = null;
						
				if(!this.ADMIN_ROLE){
					
					bukrs = this.getBukrs();
					werks = this.getWerks();
				}
				
				let docInvBean = new Object();
				docInvBean.bukrs = bukrs;
				docInvBean.werks = werks;
				docInvBean.docInvId = (search.trim().length == 0? null: search); 	
		
				const request = {
					tokenObject: null,
					lsObject: docInvBean
				};
				const json = await this.execService(InveServices.FRESC_GET_CLOSED_CONCILIATIONS_ID,request,"getClosedConciliationsID",this.showLog);
		
				if(json){
					for(let i in json.lsObject){
						json.lsObject[i].idAux = parseInt(json.lsObject[i].id);
					}
					//Create a model and bind the table rows to this model           		            		
					this.byId("oTable").setModel(new JSONModel(json.lsObject), "oModel");
					this.byId("oTable").setGrowingThreshold(json.lsObject.length);        
					BusyIndicator.hide();
				}
			},
			selectedDocument: function(oEvent){
				let docId = sap.ui.getCore().byId(oEvent.getParameters().id).getCells()[0].getText();
				let modelData = this.frgById("oTable").getModel("oModel").getData();
				let row;
				for(let i in modelData){
					if(docId == modelData[i].id){
						row = modelData[i];
						break;
					}
				}

				if(!row.available){
					MessageBox.warning('Extrayendo información de SAP, intente más tarde.',
							MessageBox.Icon.WARNING, "Warning");
					this.getDocsIdsFresh();
					return;
				}
				BusyIndicator.show(0);
				this.getDocWithPositions(docId);
			},
			getDocWithPositions: async function(docId){
				const request = {
					tokenObject: null,
					lsObject: {
						docInvId:docId
					}
				};
				let json = await this.execService(InveServices.GET_CLOSED_CONCILIATIONS_FRESCURA,request,"getClosedConciliationsFrescura",this.showLog);
		
				if(json){
					this.cleanView();
					this.byId('docInvId').setValue(json.lsObject.conciliationList[0].docInvId);
					for(let i in json.lsObject.conciliationList){
						if(json.lsObject.conciliationList[i].bukrs){
							this.byId('bukrs').setValue(json.lsObject.conciliationList[i].bukrs);
							this.byId('werks').setValue(json.lsObject.conciliationList[i].werks);
							this.byId("createdBy").setValue(json.lsObject.conciliationList[i].createdBy);
							
							this.byId("dStart").setValue(json.lsObject.conciliationList[i].createdDate);
							this.byId("dEnd").setValue(json.lsObject.conciliationList[i].modifiedDate);
							break;
						}
					}
					
					this.byId("agrupado").setEnabled(true);
					this.disabledFilters();
					let positions = json.lsObject.conciliationList;
					positions.forEach(p =>{
						this.colorEstatus(p);
					})
					this.byId("oTableFresc").setModel(new JSONModel(positions),"oModel");
					let listUser = "";
					for(let i in json.lsObject.userList){
						listUser+= json.lsObject.userList[i].entity.identyId+" - "+json.lsObject.userList[i].genInf.name+" "+json.lsObject.userList[i].genInf.lastName+"\n"
					}
					this.byId("countedBy").setValue(listUser);
					this._closeDialog();
				}
			},
			assembleMatnr:function(){
				let modelData = this.byId("oTableFresc").getModel("oModel").getData();
			
				let mapMatnr = new Map();//creando mapa que contendrá como llave: material, almacén y lote. Como valor: cantidad contada del material
				for(let i in modelData){
					if(modelData[i].estatusPt){
						if(mapMatnr.has(modelData[i].matnr+" - "+modelData[i].lgort+" - "+modelData[i].lote)){//si ya existe la llave, solo sumamos la cantidad
							let quantity = mapMatnr.get(modelData[i].matnr+" - "+modelData[i].lgort+" - "+modelData[i].lote);
							mapMatnr.set(modelData[i].matnr+" - "+modelData[i].lgort+" - "+modelData[i].lote,quantity+parseFloat(modelData[i].counted));
						}else{
							mapMatnr.set(modelData[i].matnr+" - "+modelData[i].lgort+" - "+modelData[i].lote,parseFloat(modelData[i].counted));
						}
					}
					
				}
				this.assembleModel(mapMatnr,modelData);
				
			},
			assembleModel: function(mapMatnr,modelData){
				let groupedModel = [];
				mapMatnr.forEach (function(value, key) {
					let splitKey = key.split(" - ");
					//console.log(key + ' = ' + value);
					for(let i in modelData){
						if(splitKey[0] == modelData[i].matnr && splitKey[1] == modelData[i].lgort && splitKey[2] == modelData[i].lote){
							let obj = new Object();
							obj={
								matnr: modelData[i].matnr,
								maktx: modelData[i].maktx,
								lgort: modelData[i].lgort,
								lgobe: modelData[i].lgobe,
								lote: modelData[i].lote,
								theoric: modelData[i].theoric,
								counted: value,
								meins: modelData[i].meins,
								fecProd: modelData[i].fecProd,
								estatusPt: modelData[i].estatusPt,
								cinsm: modelData[i].cinsm,//Stock bloqueado
								clabs: modelData[i].clabs,//Stock libre utilización
								cspem: modelData[i].cspem,//Stock en control de calidad
								state:  modelData[i].state,
								theoricAlmacen: modelData[i].theoricAlmacen,
								accuracy: this.formatNumber(parseFloat(modelData[i].counted) / parseFloat(modelData[i].theoric)*100)
							};
							groupedModel.push(obj);
							break;
						}
					}
				}.bind(this));
				this.byId("oTableGroupedFresc").setModel(new JSONModel(groupedModel),"oModel");
				this.visibleTableFilter();
			},
			onQuickFilter: function (oEvent) {
				if(oEvent.getParameter("selectedKey") == "AGRUPADO"){
					this.byId("iconTabBar").setExpanded(true);
					this.assembleMatnr();
					this.enabledFilters();
					return;
				}
				if(oEvent.getParameter("selectedKey") == "PT"){
					this.byId("iconTabBar").setExpanded(true);
					this.switchVisibleTables();
					return;
				}
				this.visibleTableFilter();
				let oBinding = this.byId("oTableGroupedFresc").getBinding("items");
				let oFilterSearch = new Filter(
					"estatusPt",
					FilterOperator.Contains,
					oEvent.getParameter("selectedKey")
				);
				oBinding.filter(oFilterSearch);
			},
			cleanView:function(){
				
				this.showLog=false;
				this.ADMIN_ROLE = this.roleExists("INV_CIC_ADMIN");
				if(this.roleExists("INVE_CO")){
					this.byId("loss").setVisible(false);
					this.byId("bloqueado").setVisible(true);
					this.byId("fuera").setVisible(false);
					this.byId("libre").setVisible(true);
					this.byId("riesgo").setIconColor("Negative");
					this.byId("en_tiempo").setIconColor("Critical");
				  }else if(this.roleExists("INVE_MX")){
					this.byId("loss").setVisible(true);
					this.byId("bloqueado").setVisible(false);
					this.byId("fuera").setVisible(true);
					this.byId("libre").setVisible(false);
					this.byId("riesgo").setIconColor("Critical");
					this.byId("en_tiempo").setIconColor("Positive");
						}
				this.byId("oTableGroupedFresc").setVisible(false);
				this.byId("oTableFresc").setVisible(true);
				this.byId("oTableFresc").setModel(new JSONModel([]),"oModel");
				this.byId("oTableGroupedFresc").setModel(new JSONModel([]),"oModel");
				this.byId('docInvId').setValue(null);
				this.byId('bukrs').setValue(null);
				this.byId('werks').setValue(null);
				this.byId("createdBy").setValue(null);
				this.byId("countedBy").setValue(null);
				this.byId("dStart").setValue(null);
				this.byId("dEnd").setValue(null);
				this.byId("iconTabBar").setSelectedKey("PT");
				let arrTabs = this.byId("iconTabBar").getItems();
				for(let i in arrTabs){
					
					try {
						if(arrTabs[i].getKey() != "PT"){
							arrTabs[i].setEnabled(false);
						}
					} catch (error) {
						console.log("id",arrTabs[i].sId);
					}
					
				}
				if(this.BTN_LOTE){
					this.BTN_LOTE.setText("Desestimar Lote");
					this.BTN_LOTE.setPressed(false);
				}
			},
			enabledFilters:function(){
				let arrTabs = this.byId("iconTabBar").getItems();
				for(let i in arrTabs){
					
					try {
						arrTabs[i].setEnabled(true);
					} catch (error) {
						console.log("id",arrTabs[i].sId);
					}
					
				}
			},
			disabledFilters:function(){
				let arrTabs = this.byId("iconTabBar").getItems();
				for(let i in arrTabs){
					
					try {
						if(arrTabs[i].getKey() != "PT" && arrTabs[i].getKey() != "AGRUPADO"){
							arrTabs[i].setEnabled(false);
						}
						
					} catch (error) {
						console.log("id",arrTabs[i].sId);
					}
					
				}
			},
			switchVisibleTables:function(){
				let visible = this.byId("oTableGroupedFresc").getVisible();
				this.byId("oTableGroupedFresc").setVisible(!visible);
				this.byId("oTableFresc").setVisible(visible);
			},
			visibleTableFilter:function(){
				this.byId("oTableGroupedFresc").setVisible(true);
				this.byId("oTableFresc").setVisible(false);
			},
			desestimar:function(evt){
				this.BTN_LOTE=evt.getSource();
				if(evt.getSource().getPressed()){//Desestimar presionado. Mostrar teorico por almacen
					this.byId("txtTheoric").setText("Teorico SAP por Almacén");
					this.byId("colTheoricLote").setVisible(false);
					this.byId("colTheoricLgort").setVisible(true);
					evt.getSource().setText("Estimar Lote");
					this.accuracyColumn(false);
				}else{
					//Mostrar teorico por lote
					this.byId("txtTheoric").setText("Teorico SAP por Lote");
					this.byId("colTheoricLote").setVisible(true);
					this.byId("colTheoricLgort").setVisible(false);
					evt.getSource().setText("Desestimar Lote");
					this.accuracyColumn(true);
				}
			},
			accuracyColumn:function(lote){
				let modelData = this.byId("oTableGroupedFresc").getModel("oModel").getData();
				if(lote){
					for(let i in modelData){
						modelData[i].accuracy = this.formatNumber(parseFloat(modelData[i].counted) / parseFloat(modelData[i].theoric)*100);
					}
				}else{
					for(let i in modelData){
						modelData[i].accuracy = this.formatNumber(parseFloat(modelData[i].counted) / parseFloat(modelData[i].theoricAlmacen)*100);
					}
				}
				this.byId("oTableGroupedFresc").getModel("oModel").refresh(true);
			}
		});
	});
