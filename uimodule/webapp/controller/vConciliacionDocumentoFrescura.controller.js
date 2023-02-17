sap.ui.define(
	[
		"com/bmore/inveweb/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"sap/ui/model/FilterType",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/m/MessageBox",
		"sap/ui/core/BusyIndicator",
		"sap/ui/core/Item",
		"sap/ui/core/MessageType",
		"sap/ui/core/Fragment",
	],
	function (BaseController, JSONModel, FilterType, Filter, FilterOperator, MessageBox, BusyIndicator,Item,MessageType,Fragment) {
		"use strict";

		return BaseController.extend("com.bmore.inveweb.controller.vConciliacionDocumentoFrescura", {
			onInit: function () {
			},
			return: function(){
				this.onNavBack();
			},
			semiInit: function(){
				this.ADMIN_ROLE = this.roleExists("INV_CIC_ADMIN");
				BusyIndicator.hide();
				this.showLog=false;
				
				this.loadDocFresc();
			},
			eraseNotification : function() {
				this.byId("vbFrame").setVisible(false);	
			},
		
			loadDocFresc: async function(){
					
				this.eraseNotification();
				
				let lsObject = [];	
				if(!this.ADMIN_ROLE){
					let bukrs = this.getBukrs();
					lsObject.push(bukrs);
					let werks =	this.getWerks();
					lsObject.push(werks);
				}else{
					lsObject.push(null);
					lsObject.push(null);
				}
		
				const request = {
					tokenObject: null,
					lsObject: lsObject
				};
		
				const json = await this.execService(InveServices.FRESC_GET_CONCILIATIONS_ID,request,"loadDocFresc",this.showLog);
		
				if(json){
					//Create items for select             		
					let lsIDsConc = json.lsObject;
					this.infoIds = lsIDsConc;
					let docInvCombo = this.byId("idConc");
					docInvCombo.removeAllItems();
					docInvCombo.destroyItems();
					
					for(let i in lsIDsConc){
						
						this.generateItem("idConc","DOC INV : "+lsIDsConc[i].id,
								lsIDsConc[i].id,lsIDsConc[i].id,false);
					}	
					
					BusyIndicator.hide();
				}
			},
			generateItem: function(select,text,key,tooltip,selectedItem){
					
				let selectComponent = this.byId(select);
				let item = new Item({
					text : text, // string
					key : key, // string
					tooltip : tooltip, // TooltipBase										
					});
				selectComponent.addItem(item);
				if(selectedItem){
					selectComponent.setSelectedItem(item);
				}
			},

			loadConciliationIDChilds: async function(){
				this.eraseNotification();
				try {
					this.byId("idConc").getSelectedItem().getKey();
				} catch (error) {
					this.byId("idConc").setSelectedItem(null);
					return;
				}
				let docInvBean = new Object();
				docInvBean.docInvId = this.byId("idConc").getSelectedItem().getKey();
				for(let indice in this.infoIds){
					if(this.infoIds[indice].id == docInvBean.docInvId){
						break;
					}
				}
				
				const request = {
					tokenObject: null,
					lsObject: docInvBean
				};
	
				const json = await this.execService(InveServices.FRESC_GET_CONCILIATIONS_ID_CHILDS,request,"getConciliationIDChilds",this.showLog);
	
				if(json){
					BusyIndicator.show(0);
					//Create items for select             		
					let lsIDsChildConc = json.lsObject;
					let docInvChildsCombo = this.byId("idConcInt");
					docInvChildsCombo.setSelectedKey(null);
					docInvChildsCombo.removeAllItems();
					docInvChildsCombo.destroyItems();
					this.arrDocsInternalsIds = []; // for closeAllDocs
					
					if(lsIDsChildConc == undefined || lsIDsChildConc.length == 0){
						
						MessageBox.show('No se encontraron documentos internos, favor de revisar el Doc Inv '+docInvBean.docInvId,
								MessageBox.Icon.ERROR, "Documento vacío");
						
						BusyIndicator.hide();
						return;
					}
					
					docInvChildsCombo.setEnabled(true);
					
					
					if(lsIDsChildConc.length == 1){
						this.generateItem("idConcInt",lsIDsChildConc[0].desc,
								lsIDsChildConc[0].id,lsIDsChildConc[0].id,true);
						this.loadDocInvInfo();
					}else{
						this.toast("Documento con "+lsIDsChildConc.length+" rutas.\nFavor de Seleccionar documento interno", "20em");
						BusyIndicator.hide();
						for(let i in lsIDsChildConc){
							this.arrDocsInternalsIds.push(lsIDsChildConc[i].id);
							this.generateItem("idConcInt",lsIDsChildConc[i].desc,
									lsIDsChildConc[i].id,lsIDsChildConc[i].id,false);
						}	
					}
				}
			},
			loadDocInvInfo: async function(){
				this.eraseNotification();
				this.byId("oTable").setModel(new JSONModel([]),"oModel");
				let docInvBean = new Object();
				docInvBean.docInvId = this.byId("idConcInt").getSelectedItem().getKey();
	
				const request = {
					tokenObject: null,
					lsObject: docInvBean
				};
	
				let json = await this.execService(InveServices.FRESC_GET_CONCILIATION,request,"getConciliation",this.showLog);
				
				if(json){
					if(!json.lsObject.concluded){
						this.byId("btnCloseDoc").setEnabled(false);
                        //Mostrar mensaje de que no se han concluido los conteos 1A y/o 1B
                        MessageBox.show('No se ha concluido el conteo.',
                                MessageBox.Icon.WARNING, "Advertencia.");
                        
                        BusyIndicator.hide();
                        return;
                    }
					this.byId("btnCloseDoc").setEnabled(true);
					this.flagCountE = json.lsObject.countE;
					let arrPos = json.lsObject.positions
					this.byId("bukrs").setValue(json.lsObject.bukrs+" - "+json.lsObject.bukrsD);
                    this.byId("werks").setValue(json.lsObject.werks+" - "+json.lsObject.werksD);
                    this.byId("route").setValue(json.lsObject.route);
					
					if(json.lsObject.positions.length > 0){
						this.byId("btnExcel").setEnabled(true);
					}else{
						this.byId("btnExcel").setEnabled(false);
					}

                        this.byId("idCountXC").setVisible(false);
                        
						//procesamiento de datos de posiciones para considerar si es conteo normal o especial(reconteo)
                        for(let i in arrPos){
                            arrPos[i].count1AAux = parseFloat(arrPos[i].count1A);
                            arrPos[i].count1A = this.formatNumber(parseFloat(arrPos[i].count1A));
                            if(arrPos[i].countX != undefined){
                                if(arrPos[i].countX != undefined && arrPos[i].countX != "0"){
                                    arrPos[i].countType = 4;
                                }
                                arrPos[i].countX =  this.formatNumber(parseFloat(arrPos[i].countX))
                            }
							try {
								let splitLote = arrPos[i].lote.split("|");
								if(splitLote[0].toUpperCase() === splitLote[1].toUpperCase()){
									arrPos[i].lote = splitLote[0].toUpperCase();
								}
								} catch (error) {
									console.warn("lote",arrPos[i].lote);
								}
							try {
									let splitEstatusPT = arrPos[i].estatusPt.split("|");
									if(splitEstatusPT[0].toUpperCase() === splitEstatusPT[1].toUpperCase()){
										arrPos[i].estatusPt = splitEstatusPT[0].toUpperCase();
									}
								} catch (error) {
									console.warn("estatusPt",arrPos[i].estatusPt);
								}
								this.colorEstatus(arrPos[i]);
							
                        }

						//mostramos los datos ya procesados en la tabla
						this.byId("oTable").setModel(new JSONModel(arrPos),"oModel");
                        
                        if(json.lsObject.countA){
							this.byId("btnRecount").setEnabled(true);
                        }
						if(this.flagCountE){
							this.byId("bCountEFilter").setVisible(true);
							this.byId("bCountEFilter").setPressed(true);
							this.byId("idCountXC").setVisible(true);
							
						}else{
							this.byId("idCountXC").setVisible(false);
							this.byId("bCountEFilter").setVisible(false);
						}

					 BusyIndicator.hide();
				}
			},
			refresh: function(){
            
				this.cleanView();
				setTimeout(function() {
					this.loadDocFresc();
				}.bind(this),500);	
			},
			cleanView: function(){
				let docInvCombo = this.byId("idConc");
				docInvCombo.setSelectedKey(null);
				docInvCombo.removeAllItems();
				docInvCombo.destroyItems();
				this.byId("idConcInt").setSelectedKey(null);
				this.byId("idConcInt").removeAllItems();
				this.byId("idConcInt").destroyItems();
				
				this.byId("bukrs").setValue("");
				this.byId("werks").setValue("");
				this.byId("route").setValue("");

				this.byId("btnRecount").setEnabled(false);
				this.byId("btnExcel").setEnabled(false);

				this.byId("oTable").setModel(new JSONModel([]),"oModel");
			},
			filterCount: function(oEvent){
                let sQuery = oEvent.getSource().getValue();
                let oFilter = new Filter({
                  filters: [
                    new Filter("lgort", FilterOperator.Contains, sQuery),
                    new Filter("lgpla", FilterOperator.Contains, sQuery),
                    new Filter("matnr", FilterOperator.Contains, sQuery),
                    new Filter("matnrD", FilterOperator.Contains, sQuery),
                    new Filter("lote", FilterOperator.Contains, sQuery),
					new Filter("prodDate", FilterOperator.Contains, sQuery),
					new Filter("estatusPt", FilterOperator.Contains, sQuery),
					new Filter("measureUnit", FilterOperator.Contains, sQuery),
                  ],
                  and: false
                });
                let oBinding =  this.byId("oTable").getBinding("items");
                oBinding.filter(oFilter, FilterType.Application);
            },
			exportExcel: function(){
				this.downloadFrescuraXLSX(this.byId("oTable").getModel("oModel").getData(),this.byId('idConc').getValue().split("DOC INV : ")[1]);
			},
			closeDocument: function(){
                MessageBox.confirm(
                         "¿Desea cerrar todos los documentos internos del documento "+this.byId("idConc").getSelectedKey()+" ?", {
                              icon: MessageBox.Icon.QUESTION,
                              actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                              onClose: function(oAction) { 
                                  
                                if(oAction == 'YES'){
                                    this.closeAllDialyDocs();
                                }  			        	  			        	  
                            }.bind(this)						
                        }
                    );
                
            },
			closeAllDialyDocs: async function(){

                const request = {
                    tokenObject: null,
                    lsObject: this.byId("idConc").getSelectedKey()
                };

                const json = await this.execService(InveServices.CLOSE_DOCS_SPLIT,request,"closeAllDialyDocs",this.showLog);

			if(json){
                BusyIndicator.hide();
                this.message('Documento de Inventario '+request.lsObject+' cerrado completamente.',MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pConciliation"));
                
                setTimeout(function() {
                    this.byId("messagesBox").getItems()[0].close(); 
                    this.refresh();
                }.bind(this),3000);
            }
    
            },
			getFatherTaskByDocId: async function(){
				let docInvId = this.byId("idConcInt").getSelectedKey();
				const request = {
					tokenObject: null,
					lsObject: docInvId
				};
				const json = await this.execService(InveServices.GET_FATHER_TASK_BY_DOC_ID,request,"getFatherTaskByDocId",this.showLog);
	
				if(json){
					return json.lsObject;
				}else{
					return false;
				}	
			},
			frgById: function(id){

				return Fragment.byId(this.getView().getId(),id);
			},
			_closeDialog:function(){
				this.byId("oDialogRecountFresh").close();
			},
			askRecount: function(){
				let oView = this.getView();
				if (!this.byId("oDialogRecountFresh")) {
					Fragment.load({
						id: oView.getId(),
						name: "com.bmore.inveweb.view.fragments.vMCRecountFrescura",
						controller: this
					}).then(function (oDialog) {
						oView.addDependent(oDialog);
						this.frgById("oTableRecountFresh").setModel(new JSONModel([]),"oModel");
						oDialog.open();
						oDialog.addStyleClass("sapUiSizeCompact");
					}.bind(this));
				} else {
					this.frgById("oTableRecountFresh").setModel(new JSONModel([]),"oModel");
					this.byId("oDialogRecountFresh").open();
					this.byId("oDialogRecountFresh").addStyleClass("sapUiSizeCompact");
				}
			},
			searchAsignTo: function(evt){
				if(evt.getParameters().clearButtonPressed){
					return;
				}
				BusyIndicator.show(0);
				let search = this.frgById("fSearch").getValue().trim();
	
					if(search == "" || search.length == 0){
						MessageBox.show('Favor de ingresar el id de red (VDI) o nombre completo del contador',
									MessageBox.Icon.ERROR, "Información Incompleta");
							BusyIndicator.hide();
						return;
					}
					this.loadLDAP_Users(search);
				
			},
			loadLDAP_Users: async function (user){
				const request = {
					tokenObject: null,
					lsObject:user
				};
				const json = await this.execService(InveServices.GET_UME_USERS,request,"loadLDAP_Users",this.showLog);
	
				if(json){
					let arr = [];
					let obj = {};
					
					for(let i = 0; i < json.lsObject.length; i++){
							
						obj = {}; 
						obj.id = json.lsObject[i].entity.identyId;
						obj.desc = json.lsObject[i].genInf.name + " " + json.lsObject[i].genInf.lastName;
						arr.push(obj);
						
					}
					
					this.frgById("oTableRecountFresh").setModel(new JSONModel(arr) ,"oModel");
					BusyIndicator.hide();  
				}
			},
			selectAssignTo: async function(oEvent){
				let listItems = oEvent.getParameters().listItem;
				let agreggation = listItems.mAggregations;
				let  cells = agreggation.cells;
				let row = {
					id : cells[0].getText(),
					desc : cells[1].getText()
				}
	
				this.execRecount(row.id);
				this._closeDialog();		
			},	
			execRecount: async function(userId){
				BusyIndicator.show();
            
				let docBean = new Object();
				docBean.docInvId = this.byId("idConcInt").getSelectedKey();//obtenemos documento interno
				docBean.route = this.byId("route").getValue();
				docBean.bukrs = this.byId("bukrs").getValue().split(" - ")[0];
				docBean.bukrsD = null;
				docBean.werks = this.byId("werks").getValue().split(" - ")[0];
				docBean.werksD = null;
				docBean.type = null;
				docBean.status = null;
				docBean.createdBy = null;
				
				let taskBean = new Object();
				taskBean.taskId = null;
				taskBean.groupId = userId; 
				taskBean.docInvBean = docBean; 
				taskBean.taskJSON = ""// super bean del figue
				taskBean.dCreated= null;
				taskBean.dDownlad= null;
				taskBean.dUpload= null;
				taskBean.status = true;
				taskBean.rub = null;
				
				let taskFather = await this.getFatherTaskByDocId();
				if(!taskFather){
					return;
				}
				taskBean.taskIdFather = taskFather.taskId;//servicio de eric;
				
				const request = {
					tokenObject: null,
					lsObject:taskBean
				};
				const json = await this.execService(InveServices.FRESC_GET_SPECIAL_COUNT,request,"FrescuraGetSpecialCount",this.showLog);

				if(json){
					BusyIndicator.hide();
					let taskId = json.lsObject.taskId;
					
					this.message('Se generó la tarea para reconteo frescura exitosamente con Id: ' + taskId ,MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pConDocFrescura"));
					
					setTimeout(function() {
						this.byId("messagesBox").getItems()[0].close();     
					}.bind(this),10000);
				}
			},
			filterCE:function(){
				this.byId("bCountEFilter").setPressed(true);
			},
		});
	});
