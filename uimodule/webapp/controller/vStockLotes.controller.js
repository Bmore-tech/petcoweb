sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/BusyIndicator",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "thirdparty/axios/dist/axios.min",
  ],
  function (BaseController, JSONModel, BusyIndicator, Filter, FilterOperator, MessageToast, MessageBox
  ) {
    "use strict";

    return BaseController.extend("com.bmore.inveweb.controller.vStockLotes", {
      onInit: function () {
        this.getView().addDelegate({
          onBeforeShow: function () {
            sap.ui.getCore().byId("container-inveweb---idAppControl").getController().dashboardFrescuraNavbar();
            
          }.bind(this)
        });
      },

      semiInit:async function(){
		if(!this.ALREADY_EXECUTED){
			this.ADMIN_ROLE = this.roleExists("INV_CIC_ADMIN");
			this.SYNC_PRICE = this.roleExists("SYNC_PRICE_FRESCURA");
			if(this.SYNC_PRICE){
			  this.byId("precios").setVisible(true);
			}else{
			  this.byId("precios").setVisible(false);
			}
			this.showLog=false;
			this.FrescuraModel = new JSONModel({
			  Materiales: []
			});
			this.getView().setModel(this.FrescuraModel, "FrescuraModel");
			console.log("init de Frescura COPEC");
			await this.setBukrsAndWerks();
			if(!this.ADMIN_ROLE){
			  this.asyncLoadFrescura();
			}
			this.ALREADY_EXECUTED=true;
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
				//this.eraseNotification();
		
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
		
					}else{
		
						MessageBox.show('La "Sociedad" seleccionada no cuenta con centros asociados',
								MessageBox.Icon.ERROR, "Sin centros");
					}	
					this.byId("sync").setEnabled(false);
					this.byId("precios").setEnabled(false);
				}
			},
      refresh:function(){
				if(!this.ADMIN_ROLE){// NO es admin por lo que recargamos la tabla con datos de sociedad y centro de los combos ya definimos por el rol del usuario
					this.asyncLoadFrescura();
				}else{//es admin por lo que recargamos la tabla mandando el centro elegido por el usuario admin
					this.getFrescuraByWerk();
				}
				
			},
      getFrescuraByWerk: async function(){
				let bukrs = this.byId('bukrs').getSelectedKey();
				let werks = this.byId('werks').getSelectedKey();
				if(bukrs == undefined || bukrs == "" || werks == undefined || werks == ""){
					MessageBox.show('Favor de seleccionar "Sociedad" y "Centro"',
					MessageBox.Icon.ERROR, "Información incompleta");
					this.byId("sync").setEnabled(false);
					this.byId("precios").setEnabled(false);
					this.byId("btnRefresh").setEnabled(false);
					return;
				}
				this.byId("btnRefresh").setEnabled(true);
				const request = {
					tokenObject: null,
					lsObject: werks
				  };
				BusyIndicator.show(0);
				try {
					let data = await this.loadFrescura(request);
					console.log("[loadFrescura] modelFrescura", data);
					this.FrescuraModel.setProperty("/Materiales", data);
					this.byId("sync").setEnabled(true);
					this.byId("precios").setEnabled(true);
				} catch (e) {
					console.error("[loadFrescura] e", e);
					MessageBox.show(e, MessageBox.Icon.ERROR, "Error [loadFrescura]");
				}
				BusyIndicator.hide();
			},
      asyncLoadFrescura: async function () {
				BusyIndicator.show(0);
				try {
					const request = {
						tokenObject: null,
						lsObject: this.byId('werks').getSelectedKey()
					  };
					let data = await this.loadFrescura(request);
					this.byId("btnRefresh").setEnabled(true);
					console.log("[loadFrescura] modelFrescura", data);
					this.FrescuraModel.setProperty("/Materiales", data);
					this.byId("sync").setEnabled(true);
					this.byId("precios").setEnabled(true);
				} catch (e) {
					console.error("[loadFrescura] e", e);
					MessageBox.show(e, MessageBox.Icon.ERROR, "Error [loadFrescura]");
				}
				BusyIndicator.hide();

			},

      loadFrescura: async function (request) {
				console.log("request",request);
				const json = await this.execService(InveServices.GET_SQL_MCHB,request,"loadFrescura",this.showLog);
				if(json){
							
				return json.lsObject;
				
				}
				
			
			},
      onQuickFilter: function (oEvent) {
				if(oEvent.getParameter("selectedKey") == "SINCRONIZAR"){
					this.byId("iconTabBar").setExpanded(true);
					this._syncMCHB();
					return;
				}
				if(oEvent.getParameter("selectedKey") == "PRECIOS"){
					this.byId("iconTabBar").setExpanded(true);
					this._syncPrecios();
					return;
				}
			},

      _syncMCHB: function(){
				MessageBox.warning("Al sincronizar se borrará la información actual de Inventarios para el centro "+this.byId('werks').getSelectedKey()+"\n ¿Desea continuar?", {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function (sAction) {
                    if (sAction == "OK") {
						try{
							BusyIndicator.show(0);
							 MessageToast.show("Ejecutando sincronización MCHB de SAP para centro "+this.byId('werks').getSelectedKey()+"...");
							 const request = {
								tokenObject: null,
								lsObject: this.byId('werks').getSelectedKey()
							  };
							this.wrapExtractMCHB(request);
							
						}catch(e){
							MessageBox.show(e.toString(), MessageBox.Icon.ERROR, "Sincronización");
						}
						
                       
                    } else {
                        MessageToast.show("Operación cancelada");
                    }
                }.bind(this)
           	 });
			},
      _syncPrecios: function(){
				MessageBox.warning("Al sincronizar se borrará la información actual de precios de materiales  para el centro "+this.byId('werks').getSelectedKey()+"\n ¿Desea continuar?", {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function (sAction) {
                    if (sAction == "OK") {
						try{
							BusyIndicator.show(0);
							 MessageToast.show("Ejecutando sincronización de precios de MBEW SAP para centro "+this.byId('werks').getSelectedKey()+"...");
							 const request = {
								tokenObject: null,
								lsObject: this.byId('werks').getSelectedKey()
							  };
							this.wrapExtractPrecios(request);
							
						}catch(e){
							MessageBox.show(e.toString(), MessageBox.Icon.ERROR, "Sincronización de Precios");
						}
						
                       
                    } else {
                        MessageToast.show("Operación cancelada");
                    }
                }.bind(this)
           	 });
			},
      wrapExtractMCHB: async function(request){
				await this.extractManualFromSAP_MCHB(request);
				this.asyncLoadFrescura();
			},

      wrapExtractPrecios: async function(request){
				await this.extractMBEW_Frescura_FromSAP(request);
				this.asyncLoadFrescura();
			},
			
			extractManualFromSAP_MCHB: async function (request) {
				const json = await this.execService(InveServices.EXTRACT_MCHB,request,"extractManualFromSAP_MCHB",this.showLog);
				if(json){
					console.log("Result extractManualFromSAP_MCHB",json.abstractResult.resultMsgAbs);
				}
				
			},
			extractMBEW_Frescura_FromSAP: async function (request) {
				const json = await this.execService(InveServices.EXTRACT_MBEW_FRESCURA,request,"extractMBEW_Frescura_FromSAP",this.showLog);
				if(json){
					console.log("Result extractMBEW_Frescura_FromSAP",json.abstractResult.resultMsgAbs);
				}
				
			},

    });

  });

