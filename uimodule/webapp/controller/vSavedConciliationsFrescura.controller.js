sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/BusyIndicator",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/DatePicker",
    "sap/ui/model/FilterType",
	"sap/m/MessageBox",
	"sap/m/Dialog",
	"sap/m/Button",
    "thirdparty/axios/dist/axios.min",
  ],
  function (BaseController, JSONModel, BusyIndicator, Filter, FilterOperator, DatePicker, FilterType, MessageBox,Dialog,Button) {
    "use strict";

    return BaseController.extend("com.bmore.inveweb.controller.vSavedConciliationsFrescura", {
      onInit: function () {
      },

      semiInit:async function(){
		  if(!this.ALREADY_EXECUTED){
			this.ADMIN_ROLE = this.roleExists("INV_CIC_ADMIN");
			this.showLog=false;
			this.FrescuraModel = new JSONModel({
			  Materiales: []
			});
			this.getView().setModel(this.FrescuraModel, "FrescuraModel");
			console.log("init de Frescura COPEC");
			await this.setBukrsAndWerks();
			if(!this.ADMIN_ROLE){
			  this.asyncGetSavedConciFrescura();
			}
			this.ALREADY_EXECUTED=true;
		  }
          if(this.ADMIN_ROLE){
			  this.byId("btnSearch").setVisible(true);
		  }else{
			this.byId("btnSearch").setVisible(false);
		  }
		  if(this.roleExists("INVE_CO")){
			this.byId("bloqueado").setVisible(true);

			this.byId("fuera").setVisible(false);
			this.byId("libre").setVisible(true);
			this.byId("riesgo").setIconColor("Negative");
			this.byId("en_tiempo").setIconColor("Critical");
		  }else if(this.roleExists("INVE_MX")){
			this.byId("bloqueado").setVisible(false);

			this.byId("fuera").setVisible(true);
			this.byId("libre").setVisible(false);
			this.byId("riesgo").setIconColor("Critical");
			this.byId("en_tiempo").setIconColor("Positive");
		  }
				
		},
      setBukrsAndWerks: async function(){
				await this.loadSocieties(this.byId("bukrs"));
				if(!this.ADMIN_ROLE){
		
					let bukrs = this.getBukrs();
					this.byId("bukrs").setSelectedKey(bukrs);
					this.byId("bukrs").setEnabled(false);
					await this.loadWerks();
					let werks = this.getWerks();
					this.byId("werks").setSelectedKey(werks);
					this.byId("werks").setEnabled(false);
				}else{
		
					this.byId("bukrs").setSelectedKey(null);
					this.byId("bukrs").setEnabled(true);
					this.byId("werks").removeAllItems();
					this.byId("werks").destroyItems();
					this.byId("werks").setSelectedKey(null);
					this.byId("werks").setEnabled(true);
				}
				
			},
      loadWerks: async function(){
				this.FrescuraModel.setProperty("/Materiales", []);
				this.byId("btnRefresh").setEnabled(false);
				let bukrsBean = {
					bukrs : this.byId('bukrs').getSelectedKey()
				}
		
				const request = {
					tokenObject: null,
					lsObject:bukrsBean
				};
		
				const json = await this.execService(InveServices.GET_BUKRS_AND_WERKS,request,"loadWerks",this.showLog);
		
				if(json){
					let selectWerks = this.byId("werks");
					selectWerks.removeAllItems();
					selectWerks.destroyItems();
					selectWerks.setSelectedKey(null);
					
					let data = json.lsObject;	
					
		
					if(data.length!=0){
		
						this.fillWerks(data,selectWerks);
						this.byId("btnSearch").setEnabled(true);
					}else{
						this.byId("btnSearch").setEnabled(false);
						MessageBox.show('La "Sociedad" seleccionada no cuenta con centros asociados',
								MessageBox.Icon.ERROR, "Sin centros");
					}	
				}
			},
      refresh:function(){
				if(!this.ADMIN_ROLE){// NO es admin por lo que recargamos la tabla con datos de sociedad y centro de los combos ya definimos por el rol del usuario
					this.asyncGetSavedConciFrescura();
				}else{//es admin por lo que recargamos la tabla mandando el centro elegido por el usuario admin
					let bukrs = this.byId('bukrs').getSelectedKey();
					let werks = this.byId('werks').getSelectedKey();
					if(bukrs == undefined || bukrs == "" || werks == undefined || werks == ""){
						MessageBox.show('Favor de seleccionar "Sociedad" y "Centro"',
						MessageBox.Icon.ERROR, "Información incompleta");
						this.byId("btnRefresh").setEnabled(false);
						return;
					}
					this.getSavedConciFrescuraByWerk();
				}
				
			},
      getSavedConciFrescuraByWerk: async function(){
				let bukrs = this.byId('bukrs').getSelectedKey();
				let werks = this.byId('werks').getSelectedKey();
				if(bukrs == undefined || bukrs == "" || werks == undefined || werks == ""){
					MessageBox.show('Favor de seleccionar "Sociedad" y "Centro"',
					MessageBox.Icon.ERROR, "Información incompleta");
					this.byId("btnRefresh").setEnabled(false);
					return;
				}
				
				const request = {
					tokenObject: null,
					lsObject: {
						werks : werks
					} 
				  };
				BusyIndicator.show(0);
				try {
					let data = await this.getSavedConciFrescura(request);
					console.log("[getSavedConciFrescura] modelFrescura", data);
					this.FrescuraModel.setProperty("/Materiales", data);
					this.byId("frescura_table").getModel("FrescuraModel").refresh(true);
				} catch (e) {
					console.error("[getSavedConciFrescura] e", e);
					MessageBox.show(e, MessageBox.Icon.ERROR, "Error [getSavedConciFrescura]");
				}
				BusyIndicator.hide();
			},
      asyncGetSavedConciFrescura: async function () {
				BusyIndicator.show(0);
				try {
					const request = {
						tokenObject: null,
						lsObject: {
							werks : this.byId('werks').getSelectedKey()
						}
					  };
					let data = await this.getSavedConciFrescura(request);
					console.log("[getSavedConciFrescura] modelFrescura", data);
					this.FrescuraModel.setProperty("/Materiales", data);
				} catch (e) {
					console.error("[getSavedConciFrescura] e", e);
					MessageBox.show(e, MessageBox.Icon.ERROR, "Error [getSavedConciFrescura]");
				}
				BusyIndicator.hide();

			},
		searchByBukrs:async function(){
			try {
				const request = {
					tokenObject: null,
					lsObject: {
						bukrs : this.byId('bukrs').getSelectedKey()
					}
				  };
				let data = await this.getSavedConciFrescura(request);
				
				console.log("[getSavedConciFrescura] modelFrescura", data);
				this.FrescuraModel.setProperty("/Materiales", data);
			} catch (e) {
				console.error("[getSavedConciFrescura] e", e);
				MessageBox.show(e, MessageBox.Icon.ERROR, "Error [getSavedConciFrescura]");
			}
		},

      getSavedConciFrescura: async function (request) {
				const json = await this.execService(InveServices.GET_SAVED_CONCILIATIONS_FRESCURA,request,"getSavedConciFrescura",this.showLog);
				if(json){
					let data = json.lsObject;
					data.forEach(element => {
						element.docInvId = String(element.docInvId);
						element.longClsdSapDate = parseInt(element.clsdSapDate);
						element.clsdSapDate = this.formatLongDate(parseInt(element.clsdSapDate));
						this.colorEstatus(element);
					});	
				this.byId("btnSearch").setEnabled(true);
				this.byId("btnRefresh").setEnabled(true);
				if(data && data.length > 0){
					this.byId("btnExcel").setEnabled(true);
				}else{
					this.byId("btnExcel").setEnabled(false);
				}
				return data;
				
				}
			},
			_onSearch: function (oEvent) {
				let sQuery = oEvent.getSource().getValue();
				let oFilter = new Filter({
					filters: [
						new Filter("docInvId", FilterOperator.Contains, sQuery),
						new Filter("lgort", FilterOperator.Contains, sQuery),
						new Filter("lote", FilterOperator.Contains, sQuery),
						new Filter("matnr", FilterOperator.Contains, sQuery),
						new Filter("mktx", FilterOperator.Contains, sQuery),
						new Filter("createdBy", FilterOperator.Contains, sQuery),
						new Filter("clsdSapDate", FilterOperator.Contains, sQuery),
					],
					and: false
				});
				var oBinding = this.byId("frescura_table").getBinding("items");
				oBinding.filter(oFilter, FilterType.Application);
			},
			onQuickFilter: function (oEvent) {
				if(oEvent.getParameter("selectedKey") == "MatFresc"){
					this.byId("iconTabBar").setExpanded(true);
					this.byId("frescura_table").getBinding("items").filter(null);
					return;
				}
				let oBinding = this.byId("frescura_table").getBinding("items");
				let oFilterSearch = new Filter(
					"estatusPt",
					FilterOperator.Contains,
					oEvent.getParameter("selectedKey")
				);
				oBinding.filter(oFilterSearch);
			},
			exportExcel:function(){
				let model = this.byId("frescura_table").getModel("FrescuraModel").getData().Materiales;
				if(model && model.length > 1000){//solo se aplica filtro de fecha si supera el numero de registros indicado
					if (!this.oDialogFiltro) {
      
						this.oDialogFiltro = new Dialog({
						  id: 'oDialogFiltro', // ID
						  title: "Ingrese intervalo de fecha para descargar a excel", // string
						  contentWidth: "20%", // CSSSize,
						  content: [new DatePicker ("iniDate",{placeholder:"Ingrese Fecha inicial", width: "95%"}).addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd"),
						  			new DatePicker ("endDate",{placeholder:"Ingrese Fecha Final", width: "95%"}).addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd")
						  ], // Control
						  beginButton: new Button({
							text: 'Aceptar',
							type: "Accept",
							press: function () {
								let iniDate = sap.ui.getCore().byId("iniDate").getDateValue().getFullYear() + "-" + (sap.ui.getCore().byId("iniDate").getDateValue().getMonth() + 1) + "-" + sap.ui.getCore().byId("iniDate").getDateValue().getDate();
								let endDate = sap.ui.getCore().byId("endDate").getDateValue().getFullYear() + "-" + (sap.ui.getCore().byId("endDate").getDateValue().getMonth() + 1) + "-" + sap.ui.getCore().byId("endDate").getDateValue().getDate();
								
								let initTitle = new Date(iniDate.split("-")[0], iniDate.split("-")[1] - 1, iniDate.split("-")[2]);
								let lastTitle = new Date(endDate.split("-")[0], endDate.split("-")[1] - 1, endDate.split("-")[2]);
								this.calculateDate(initTitle,lastTitle,model);
							}.bind(this)
						  }),
						  endButton: new Button({
							text: 'Cancelar',
							type: "Reject",
							press: function () {
							  this.oDialogFiltro.close();
							}.bind(this)
						  })
						});
					  }
					  this.oDialogFiltro.addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd");
					  let date = new Date();
					  let firstDayMonth = new Date(date.getFullYear(), date.getMonth(), 1);
					  let lastDayMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
					  sap.ui.getCore().byId("iniDate").setValue(firstDayMonth.getFullYear() + "-" + (firstDayMonth.getMonth() + 1) + "-" + firstDayMonth.getDate());
					  sap.ui.getCore().byId("endDate").setValue(lastDayMonth.getFullYear() + "-" + (lastDayMonth.getMonth() + 1) + "-" + lastDayMonth.getDate());
					  this.oDialogFiltro.open();
				}else{
					this.getModelExcel(model);
				}
				
				
			},
			calculateDate:function(dateInit,dateEnd,model){
				let diff = dateEnd - dateInit; 
				let filterModel=[];
				const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
				if(diffDays > 90){
					MessageBox.show('El intervalo de fecha no debe exceder 3 meses',
							 			  MessageBox.Icon.ERROR, "Archivo muy pesado");
					return;
				}else{
					this.oDialogFiltro.close();
					model.forEach(pos =>{
						if(pos.longClsdSapDate >= dateInit.getTime() && pos.longClsdSapDate <=dateEnd.getTime()){
							filterModel.push(pos);
						}
					})
					if(filterModel.length > 0){
						this.getModelExcel(filterModel);
					}else{
						MessageBox.show('No hay registros entre ese intervalo de fecha',
							 			  MessageBox.Icon.ERROR, "Sin información");
					}
					
				}
			},
			getModelExcel:function(model){
				let clonModel = this.copyObjToNew(model);
				
				let reformattedModel;
				reformattedModel = clonModel.map(function(obj){
					obj["Documento"] = obj["docInvId"];
					obj["Sociedad"] = obj["bukrs"];
					obj["Centro"] = obj["werks"];
					obj["Almacén"] = obj["lgort"];
					obj["Material"] = obj["matnr"];
					obj["Descripción"] = obj["maktx"];
					obj["U.M.B."] = obj["meins"];
					obj["Lote"] = obj["lote"];
					obj["Contado"] = obj["counted"];
					obj["Teórico Lote"] = obj["theoric"];
					obj["Teórico Almacén"] = obj["theoricAlmacen"];
					obj["Fecha Frescura"] = obj["fecProd"];
					obj["Estatus PT"] = obj["estatusPt"];
					obj["Creado por"] = obj["createdBy"];
					obj["Fecha de Guardado"] = obj["clsdSapDate"];
					obj["Nota"] = obj["notes"];

					//borrando atributos para que no se muestren en excel
					delete obj["docInvId"];
					delete obj["bukrs"];
					delete obj["werks"];
					delete obj["lgort"];
					delete obj["matnr"];
					delete obj["maktx"];
					delete obj["meins"];
					delete obj["lote"];
					delete obj["counted"];
					delete obj["theoric"];
					delete obj["theoricAlmacen"];
					delete obj["fecProd"];
					delete obj["estatusPt"];
					delete obj["createdBy"];
					delete obj["clsdSapDate"];
					delete obj["notes"];
					delete obj["countDate"];
					delete obj["countDateIni"];
					delete obj["country"];
					delete obj["createdDate"];
					delete obj["lgobe"];
					delete obj["lgpla"];
					delete obj["modifiedBy"];
					delete obj["modifiedDate"];
					delete obj["status"];
					delete obj["type"];
					delete obj["state"];
					delete obj["icon"];
					delete obj["longClsdSapDate"];
					delete obj["cinsm"];
					delete obj["clabs"];
					delete obj["cspem"];

					return obj;
				});

				let ws = XLSX.utils.json_to_sheet(reformattedModel);
				let wb = XLSX.utils.book_new();
				let bukrs = this.byId("bukrs").getSelectedKey();
				let werks = this.byId("werks").getSelectedKey();
				XLSX.utils.book_append_sheet(wb, ws, bukrs);
				if(werks && werks.length == 4){
					XLSX.writeFile(wb, "HistorialDocumentosFrescura - Soc. "+bukrs+" Centro "+werks+".xlsx");
				}else{
					XLSX.writeFile(wb, "HistorialDocumentosFrescura - "+bukrs+".xlsx");
				}
				

			}
    });

  });

