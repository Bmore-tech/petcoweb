sap.ui.define(
	[
	  "com/bmore/inveweb/controller/BaseController",
	  "sap/ui/core/BusyIndicator",
	  "sap/ui/model/json/JSONModel",
	  "sap/ui/core/Item",
	  "sap/ui/core/MessageType",
	  "sap/m/MessageBox",
	  "sap/m/ButtonType",
      "sap/ui/core/util/Export",
      "sap/ui/core/util/ExportTypeCSV",
      "sap/ui/model/Filter",
      "sap/ui/model/FilterType",
      "sap/ui/model/FilterOperator",
      "sap/ui/core/Fragment",
	],
	function (Controller,BusyIndicator,JSONModel,Item,MessageType,
                        MessageBox,ButtonType,Export,ExportTypeCSV,Filter,
                        FilterType,FilterOperator,Fragment) {
	  "use strict";
  
	  return Controller.extend("com.bmore.inveweb.controller.vConciliation", {

        onInit: function() {
            
            //Code to execute every time view is displayed
            this.getView().addDelegate({
                    
                onBeforeShow: function(evt) {
                    this.ADMIN_ROLE = this.roleExists("INV_CIC_ADMIN");
                    BusyIndicator.hide();
                    this.cleanView();
                    //Load table data
                    this.backupRecord = [];
                    this.showLog=false;
                    this.byId("oTable").setModel( new JSONModel([]),"oModel");
                    
                    this.loadDocInv();
                    this.byId("bRefresh").setEnabled(true);
                    
                }.bind(this)
            });	
        },
        
        cleanView: function(){
            
            this.byId("bCount").setEnabled(false);
            this.byId("bSpecial").setEnabled(false);
            this.byId("bSaveMassive").setEnabled(false);
            this.byId("idComplteReport").setEnabled(false);
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
            this.byId("tabBarSections").setExpanded(true);
            
            let oTable = this.byId("oTable");
            oTable.setModel(new JSONModel([]),"oModel");
            
            this.oModelC2 = new JSONModel([]);
            this.oModelC3 = new JSONModel([]);
            this.oModelCE = new JSONModel([]);
            this.oModel = new JSONModel([]);

            this.byId("bCount1Filter").setVisible(false);
            this.byId("bCount2Filter").setVisible(false);
            this.byId("bCount3Filter").setVisible(false);
            this.byId("bCountEFilter").setVisible(false);
            
            this.byId("bCount1Filter").setType(ButtonType.Default);
            this.byId("bCount2Filter").setType(ButtonType.Default);
            this.byId("bCount3Filter").setType(ButtonType.Default);
            this.byId("bCountEFilter").setType(ButtonType.Default);
            
            this.byId("bCount").setTooltip("Recontar");
        },
        
        refresh: function(){
            
            this.cleanView();
            setTimeout(function() {
                this.loadDocInv();
            }.bind(this),500);	
        },
    
        
        eraseNotification : function() {
            this.byId("vbFrame").setVisible(false);	
        },
        
        returnAction : function() {
            
            window.history.go(-1);
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
        
        selectRow: function(oEvent){
            
            let index = oEvent.getParameter("rowIndex");
            this.currentIndex = index;
            try {
                this.byId("oTable").setSelectedIndex(index);
            } catch (e) {
                console.log(e);
            }
            
        },
        
        loadDocInv: async function(){
            
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

            const json = await this.execService(InveServices.GET_CONCILIATIONS_ID,request,"loadDocInv",this.showLog);

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
                    if(this.infoIds[indice].type == "1" || this.infoIds[indice].type == "3"){
                        this.byId("bSaveMassive").setEnabled(true);
                        this.byId("idComplteReport").setEnabled(true);
                        this.byId("formComplteReport").setVisible(true);
                    }else{
                        this.byId("bSaveMassive").setEnabled(false);
                        this.byId("idComplteReport").setEnabled(false);
                        this.byId("formComplteReport").setVisible(false);
                    }
                    
                    break;
                }
            }
            
            const request = {
                tokenObject: null,
                lsObject: docInvBean
            };

            const json = await this.execService(InveServices.GET_CONCILIATION_ID_CHILDS,request,"getConciliationIDChilds",this.showLog);

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
            
            let docInvBean = new Object();
            docInvBean.docInvId = this.byId("idConcInt").getSelectedItem().getKey();

            const request = {
                tokenObject: null,
                lsObject: docInvBean
            };

            const json = await this.execService(InveServices.GET_CONCILIATION,request,"getConciliation",this.showLog);

			if(json){
                 BusyIndicator.show(0);
                //Create items for select             		
                let lsIDsChildConc = json.lsObject;
                this.arrDocsInternalsIds = []; // for closeAllDocs
                
                if(lsIDsChildConc == undefined){
                    
                    MessageBox.show('No se encontraron documentos internos, favor de revisar el Doc Inv '+docInvBean.docInvId,
                            MessageBox.Icon.ERROR, "Error");
                    
                    BusyIndicator.hide();
                    return;
                }
                
                this.byId("idConcInt").setEnabled(true);
                
                if(!json.lsObject.concluded){
                    MessageBox.show('No se ha concluido el conteo',
                            MessageBox.Icon.WARNING, "Conteo en progreso");
                    
                    BusyIndicator.hide();
                    return;
                }

                if(json.lsObject.positions == undefined || json.lsObject.positions.length == 0){
                    MessageBox.show('Documento vacío',
                            MessageBox.Icon.WARNING, "Advertencia");
                    
                    BusyIndicator.hide();
                }else{
                     BusyIndicator.show(0);
                    this.byId("tabBarSections").setExpanded(false);	
                    /////////////////limpiar Modelos///////////////////////////
                    this.byId("bCount").setEnabled(false);
                    this.byId("bSpecial").setEnabled(false);
                    
                    this.byId("lblCount1").setText("Conteo 1A");
                    this.byId("lblCount1").setTooltip("Cantidad Conteo 1A");
                    this.byId("idCount1BC").setVisible(true);
                    this.byId("idDif1C").setVisible(true);
                    this.byId("idCount2C").setVisible(false);
                    this.byId("idDif2C").setVisible(false);
                    this.byId("idCount3C").setVisible(false);
                    this.byId("idIscC").setVisible(true);

                    this.oModelC2 = new JSONModel([]);
                    this.oModelC3 = new JSONModel([]);
                    this.oModelCE = new JSONModel([]);
                    this.oModel = new JSONModel([]);

                    this.byId("bCount1Filter").setVisible(false);
                    this.byId("bCount2Filter").setVisible(false);
                    this.byId("bCount3Filter").setVisible(false);
                    this.byId("bCountEFilter").setVisible(false);
                    this.byId("bCount1Filter").setType(ButtonType.Default);
                    this.byId("bCount2Filter").setType(ButtonType.Default);
                    this.byId("bCount3Filter").setType(ButtonType.Default);
                    this.byId("bCountEFilter").setType(ButtonType.Default);
                    ///////////////FIN limpiar Modelos/////////////////////////
                    
//            		flagWarning para activar mensaje de que los conteos no han concluido
                    this.flagWarning = false;
                    //Create items for select             		
                    let lsDocInvInfo = json.lsObject;
                    let arrPos = json.lsObject.positions;
                    
                    this.byId("bukrs").setValue(lsDocInvInfo.bukrs+" - "+lsDocInvInfo.bukrsD);
                    this.byId("werks").setValue(lsDocInvInfo.werks+" - "+lsDocInvInfo.werksD);
                    this.byId("route").setValue(lsDocInvInfo.route);
                    this.type = lsDocInvInfo.type;
                    this.flagCountA = lsDocInvInfo.countA;
                    this.flagCountB = lsDocInvInfo.countB;
                    this.flagCount2 = lsDocInvInfo.count2;
                    this.flagCount3 = lsDocInvInfo.count3;
                    this.flagCountE = lsDocInvInfo.countE;
                    this.counted = lsDocInvInfo.counted;
                    this.sapRecount = lsDocInvInfo.sapRecount;
                    
                    if(!lsDocInvInfo.concluded){
                        //Mostrar mensaje de que no se han concluido los conteos 1A y/o 1B
                        MessageBox.show('No se ha concluido el conteo.',
                                MessageBox.Icon.WARNING, "Advertencia.");
                        
                        BusyIndicator.hide();
                        return;
                    }
                    
                    if(this.type == "1"){
                        
                        console.log("conteo diario");
                        this.byId("lblCount1").setText("Conteo");
                        this.byId("lblCount1").setTooltip("Cantidad del Conteo");
                        this.byId("idCount1BC").setVisible(false);
                        this.byId("idDif1C").setVisible(false);
                        this.byId("idCount2C").setVisible(false);
                        this.byId("idDif2C").setVisible(false);
                        this.byId("idCount3C").setVisible(false);
                        this.byId("idIscC").setVisible(false);
                        this.byId("idCountXC").setVisible(false);
                        
                        for(let i in arrPos){
                            arrPos[i].isc = true;
                            arrPos[i].editable = false;
                            arrPos[i].count1AAux = parseFloat(arrPos[i].count1A);
                            arrPos[i].count1A = new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'}).format(parseFloat(arrPos[i].count1A));
                            if(arrPos[i].countX != undefined){
                                if(arrPos[i].countX != undefined && arrPos[i].countX != "0"){
                                    arrPos[i].countType = 4;
                                }
                                arrPos[i].countX =  new Intl.NumberFormat("en-US", {minimumFractionDigits: '2'}).format(parseFloat(arrPos[i].countX))
                            }
                        }
                        
                        if(lsDocInvInfo.countA){
                            this.byId("bSpecial").setEnabled(true);
                            this.concludedDaily = true;
                        }else{
                            this.concludedDaily = false;
                            //Mostrar mensaje de que no se han concluido los conteos 1A y/o 1B
                            MessageBox.show('No se ha concluido el conteo.',
                                    MessageBox.Icon.WARNING, "Advertencia");
                            
                            BusyIndicator.hide();
                        }
                        
                        
                    }else if(this.type == "2"){
                        console.log("conteo mensual");
                        //Agregar atributos calculados a la tabla
                        for(let i=0;i<arrPos.length;i++){
	            			
                            try {
                                arrPos[i].count1A = arrPos[i].count1A.replace("-", "0");
                                
                            } catch (e) {
                                arrPos[i].count1A = 0;
                            }
                            this.c1A =  parseFloat(arrPos[i].count1A);
                            
                            arrPos[i].count1AAux = parseFloat(arrPos[i].count1A);
                            arrPos[i].count1A = this.formatNumber(parseFloat(arrPos[i].count1A));
                            
                            try {
                                arrPos[i].count1B = arrPos[i].count1B.replace("-", "0");
                            } catch (e) {
                                arrPos[i].count1B = 0;
                            }
                            this.c1B = parseFloat(arrPos[i].count1B); 
                            
                            arrPos[i].count1BAux = parseFloat(arrPos[i].count1B);
                            arrPos[i].count1B = this.formatNumber(parseFloat(arrPos[i].count1B));
                            
                            this.c2 = parseFloat(arrPos[i].count2); 
                            this.c3 = parseFloat(arrPos[i].count3); 
                            
                            if(lsDocInvInfo.countA && lsDocInvInfo.countB){
                                this.c1 = (this.c1A > this.c1B)? this.c1A : this.c1B;
                                this.dif = Math.abs(this.c1A - this.c1B);
                                arrPos[i].dif1Aux = this.dif;
                                arrPos[i].dif1 = this.formatNumber(this.dif);
                                if(this.dif > 0){
                                    arrPos[i].isc = true;
                                    arrPos[i].editable = false;

                                }else{
                                    arrPos[i].isc = false;
                                    arrPos[i].editable = false;
                                }
                                
                                //////////////////INICIO conteo 2/////////////////////
                                if(lsDocInvInfo.count2 && arrPos[i].count2 != undefined){
                                    arrPos[i].count2Aux = arrPos[i].count2;
                                    if(arrPos[i].count2 != undefined && arrPos[i].count2 != "0"){
                                        arrPos[i].countType = 2;
                                    }else if(arrPos[i].count2 != undefined && arrPos[i].count2 == "0"){
                                        if(this.c1A == 0 || this.c1B == 0){	
                                            arrPos[i].countType = 2;
                                        }
                                    }
                                    arrPos[i].count2 = this.formatNumber(parseFloat(arrPos[i].count2));
                                }
                                if(lsDocInvInfo.count2 && arrPos[i].dif1 != 0 && this.c2 != undefined){
                                    console.log("hay conteo 2", arrPos[i].count2);

                                    if(this.c1A == 0 && this.c1B == 0){
                                        arrPos[i].flagColor = true;							//Flag para saber si se pinta de amarillo el renglon
                                    }
                                    let dif2 = Math.abs(this.c2 - this.c1A);
                                    let dif2aux = Math.abs(this.c2 - this.c1B);
                                    if(dif2 == 0){
                                        arrPos[i].dif2Aux = dif2;
                                        arrPos[i].dif2 = this.formatNumber(dif2);
                                    }else if(dif2aux == 0){
                                        arrPos[i].dif2Aux = dif2aux;
                                        arrPos[i].dif2 = this.formatNumber(dif2aux);
                                    }else if (dif2 < dif2aux){
                                        arrPos[i].dif2Aux = dif2;
                                        arrPos[i].dif2 = String(dif2);
                                    }else{
                                        arrPos[i].dif2Aux = dif2aux;
                                        arrPos[i].dif2 = this.formatNumber(dif2aux);
                                    }
                                    
                                    this.dif = parseFloat(arrPos[i].dif2);
                                    if(this.dif > 0){
                                        arrPos[i].isc = true;
                                        arrPos[i].editable = false;
                                    }else{
                                        arrPos[i].isc = false;
                                        arrPos[i].editable = false;
                                    }
                                    
                                }else{
                                    if(lsDocInvInfo.count2 && (this.c1A == 0 && this.c1B == 0) && this.c2 != undefined){
                                        if(this.c2 == 0){
                                            arrPos[i].dif2Aux = this.c2;
                                        arrPos[i].dif2 = this.formatNumber(this.c2);
                                        arrPos[i].isc = false;
                                        arrPos[i].editable = false;
                                        }else{
                                            arrPos[i].dif2Aux = this.c2;
                                            arrPos[i].dif2 = this.formatNumber(this.c2);
                                            arrPos[i].isc = true;
                                            arrPos[i].editable = false;
                                        }
                                       
                                    }
                                }
                                //////////////////FIN conteo 2////////////////
                            /////Conteo 3
                                if(lsDocInvInfo.count3 && arrPos[i].count3 != undefined){
                                    arrPos[i].count3Aux = parseFloat(arrPos[i].count3);
                                    if(arrPos[i].count3 != undefined && arrPos[i].count3 != "0"){
                                        arrPos[i].countType = 3;
                                    }else if(arrPos[i].count3 != undefined && arrPos[i].count3 == "0"){
                                        if((this.c1A != this.c1B) && (this.c1A != this.c2) && (this.c1B != this.c2)){	
                                            arrPos[i].countType = 3;
                                        }
                                    }
                                    arrPos[i].count3 = this.formatNumber(parseFloat(arrPos[i].count3));
                                }
                                if(lsDocInvInfo.count3 && arrPos[i].dif2 != 0){
                                    console.log("hay conteo 3", this.c3);
                                    this.byId("bSpecial").setEnabled(true);
                                }
                                
                            }else{
                                this.flagWarning = true;
                                console.log("Conteo Incompleto",i);
                                break;
                            }
                            
                        }
                        
                        if(this.flagWarning){
                            //Mostrar mensaje de que no se han concluido los conteos 1A y/o 1B
                            MessageBox.show('No se han concluido los conteos.',
                                    MessageBox.Icon.WARNING, "Advertencia");
                            
                            BusyIndicator.hide();
                            }
                            
                            
                        }
                        if(this.flagCount2){
                            //mostrar boton filtro conteo 2
                            this.byId("bCount1Filter").setVisible(true);
                            this.byId("bCount2Filter").setVisible(true);
                            let arrC2 = [];
                            let c2 = 0;
                            for(let i in arrPos){
                                if(arrPos[i].count2 != undefined && arrPos[i].count2 != null){
                                    arrC2[c2] = arrPos[i];
                                    c2++;
                                }
                            }
                            
                            
                            this.oModelC2.setData(arrC2);
                            
                            
                            if(this.flagCount3){
                                //mostrar boton filtro conteo 3
                                this.byId("bCount3Filter").setVisible(true);
                                let arrC3 = [];
                                let c3 = 0;
                                for(let i in arrPos){
                                    if(arrPos[i].count3 != undefined && arrPos[i].count3 != null){
                                        arrC3[c3] = arrPos[i];
                                        c3++;
                                    }
                                }
                                
                                
                                this.oModelC3.setData(arrC3);
                                
                                
                                if(this.flagCountE){
                                    
                                    this.byId("bCountEFilter").setVisible(true);
                                    let arrCE = [];
                                    let cE = 0;
                                    for(let i in arrPos){
                                        if(arrPos[i].countX != undefined && arrPos[i].countX != null){
                                            arrCE[cE] = arrPos[i];
                                            cE++;
                                        }
                                    }
                                    
                                    console.log("Mensual arrCE",arrCE);
                                    this.oModelCE.setData(arrCE);
                                    
                                }
                            }
                        }
                       
                        
                        let oTable = this.byId("oTable");
                        
                        this.oModel.setData(arrPos);
                        oTable.setModel(this.oModel,"oModel");
                        
                        ///////////Caso tipo 1 Diario verificacion de conteo especial
                        if(this.type == "1"){
                            if(this.flagCountE){
                                this.byId("bCountEFilter").setVisible(true);
                                let arrCE = [];
                                let cE = 0;
                                for(let i in arrPos){
                                    if(arrPos[i].countX != undefined && arrPos[i].countX != null){
                                        arrCE[cE] = arrPos[i];
                                        cE++;
                                    }
                                }
                                
                                console.log("Hay arrCE en Diario",arrCE);
                                this.oModelCE.setData(arrCE);
                                
                            }
                        }
                        
                        /////////////Fin Caso tipo 1 Diario verificacion de conteo especial
                        
                        //solo se debe ejecutar para conteo Comparativo (Mensual)
                        if(this.flagCountE){
                            this.filterCE();					
                        }else if(this.flagCount3){
                            this.filterC3();
                        }else if(this.flagCount2){
                            this.filterC2();
                        }
                        
                        //enabled buttons count or close
                        this.countSelectedPositions();
                        
                        BusyIndicator.hide();
                }
                
                BusyIndicator.hide();
            }
        },
        
        selectRowBox: function(oEvent){
            
            this.countSelectedPositions();
        },
        
        countSelectedPositions: function(){
            if(this.type == "1"){
                this.byId("bCount").setEnabled(false);
                if(this.concludedDaily){
                    this.byId("bSaveMassive").setEnabled(true);
                }else if(!this.concludedDaily){
                    this.byId("bSaveMassive").setEnabled(false);
                }
                
                return;
            }
            let data;
            try {
                data =  this.byId("oTable").getModel("oModel").getData();
                
                } catch (e) {
                data = [];
                }
                let count = 0;
                for(let i in data){
                    if(data[i].isc){
                        count++;
                    }
                    this.byId("bCount").setEnabled(count > 0 ? true : false);
                    this.byId("bSaveMassive").setEnabled(count > 0 ? false : true);
                }
                
                if(this.flagCount3){
                    this.byId("bCount").setEnabled(false);
                    this.byId("bSaveMassive").setEnabled(true);
                }else
                if(this.counted == 3 && !this.flagCount2){
                    this.byId("bCount").setEnabled(false);
                    this.byId("bCount").setTooltip("Reconteo 2 en proceso");
                }else
                if(this.counted == 4 && !this.flagCount3){
                    this.byId("bCount").setEnabled(false);
                    this.byId("bCount").setTooltip("Reconteo 3 en proceso");
                }
        },
        
        getZonePosition: async function(idZone,lgpla){
            let obj = new Object();
            obj.zoneId = idZone;
            obj.lgpla = lgpla;	
            
            let key ="";

            const request = {
                tokenObject: null,
                lsObject: obj
            };
            const json = await this.execService(InveServices.GET_ZONE_POSITION,request,"getZonePosition",this.showLog);

			if(json){
                key = json.lsObject;
                BusyIndicator.hide();
                    return key;	
            }else{
                MessageBox.show(json.abstractResult.resultMsgAbs,
                    MessageBox.Icon.ERROR, "Error");
                    BusyIndicator.hide();
                    return "";
           
            }
        },
        
        loadZones: async function(zoneId){
            
            const request = {
                tokenObject: null,
                lsObject: {
                    zoneId: zoneId
                }
            };

            const json = await this.execService(InveServices.GET_ZONES,request,"loadZones",this.showLog);
            BusyIndicator.hide();
			if(json){
                return  json.lsObject;
            }else{
                return undefined;
            }
            
            
        },
        
        goarray: function (source) {
            
            if (Object.prototype.toString.call(source) === '[object Array]') {
                return source;
            } else if (typeof (source) == "object") {
                return [ source ];
            }
        },
        
        generateBean: async function(){
            let data;
            
            try {
                
                data = this.byId("oTable").getModel("oModel").getData();
                data = this.goarray(data);
            } catch (e) {
                data = [];
            }			
                    
            /////////////////////////////
            let arrZone = [];
            let flagZone;
            let zone;
                    
            for(let i in data){
                
                if(data[i].isc){
                    
                    flagZone = false;
                    for(let j in arrZone){
                        
                        if(data[i].zoneId == arrZone[j].zoneId){
                            flagZone = true;
                            break;
                        }
                    }
                                                    
                    if(!flagZone){
                        
                        zone = new Object();
                        zone.zoneId = data[i].zoneId;
                        zone.zoneD = data[i].zoneD;
                        arrZone.push(zone);
                    }
                                    
                }
            }
                        
            ////////////////////////////////
            let routeUserBean = new Object();
            routeUserBean.routeId = this.byId("route").getValue();
            routeUserBean.bukrs = this.byId("bukrs").getValue().split(" - ")[0];
            routeUserBean.werks = this.byId("werks").getValue().split(" - ")[0];
            routeUserBean.taskId = null;
            routeUserBean.rdesc = this.byId("idConcInt").getSelectedItem().getText().split(" - ")[1];
            routeUserBean.type = this.type;
            routeUserBean.BDesc = this.byId("bukrs").getValue().split(" - ")[1];
            routeUserBean.WDesc = this.byId("werks").getValue().split(" - ")[1];
            routeUserBean.reconteo = true;
            routeUserBean.dateIni = null; //long  null
            routeUserBean.dateEnd = null;	//long null
            routeUserBean.positions = []; //routeUserPositionBean
            
            ///////////////////////////////
            
            for(let i in arrZone){
                    
                let arrLgpla = [];		
                
                for(let j in data){
                    
                    if(data[j].isc){
                        
                        if(data[j].zoneId == arrZone[i].zoneId){
                            
                            arrLgpla.push(data[j].lgpla);
                        }
                                                                        
                    }
                }
                            
                let arrLgplaAux = [];
                
                for(let k in arrLgpla){
                                    
                    if(arrLgplaAux.indexOf(arrLgpla[k]) == -1){
                        
                        arrLgplaAux.push(arrLgpla[k]);
                    }
                    
                }
                
                ////////////////////////////////////
                let zoneUserBean = new Object();
                zoneUserBean.zoneId = arrZone[i].zoneId;
                zoneUserBean.zdesc = arrZone[i].zoneD;
                let positionsB = []; //ZoneUserPositionsBean			
                arrLgpla = arrLgplaAux;
                        
                for(let l in arrLgpla){
                    
    
                    let lgplaValues = new Object();
                    let keys;
                    
                    for(let m in data){
                        
    	
                        if(data[m].isc){
                                
                            if(data[m].lgpla == arrLgpla[l]){
                                                        
                                let matnr = data[m].matnr;
                                let matnrD = data[m].matnrD;
                               
                                    
                                keys = data[m].pkAsgId;
                                let lgplaValuesBean = new Object();
                                lgplaValuesBean.locked = true;
                                lgplaValuesBean.matkx = matnrD;
                                lgplaValuesBean.matnr = matnr;								
                                lgplaValues[keys + matnr]=lgplaValuesBean;
                            }
                        }
                    }
                                            
                    let zoneUserPositionsBean = new Object();
                    zoneUserPositionsBean.pkAsgId = keys
                    zoneUserPositionsBean.zoneId = arrZone[i].zoneId;
                    zoneUserPositionsBean.lgtyp = null;
                    zoneUserPositionsBean.lgpla = arrLgpla[l]; 
                    zoneUserPositionsBean.secuency = null; 
                    zoneUserPositionsBean.imwm = null; 
                    zoneUserPositionsBean.lgplaValues = lgplaValues
                        
                    positionsB.push(zoneUserPositionsBean);
                    this.keys = undefined;
                }
                    
                let listZone = await this.loadZones(arrZone[i].zoneId);
                    
                zoneUserBean.positionsB = positionsB;	
                let routeUserPositionBean = new Object();
                routeUserPositionBean.routeId = this.byId("route").getValue();
                routeUserPositionBean.positionId = null;  
                routeUserPositionBean.lgort = listZone[0].lgort;
                routeUserPositionBean.GDesc = listZone[0].GDesc;
                routeUserPositionBean.zone = zoneUserBean;
                routeUserPositionBean.secuency = null; 
                                    
                /////////////////////////////////
                routeUserBean.positions.push(routeUserPositionBean);
                                    
            }
                    
            return routeUserBean;
    
        },
        
        getRecount: function(){
            
            if(this.flagCountA && this.flagCountB){
                if(this.flagCount2){
                    if(this.flagCount3){
                        return "E";
                    }
                    return "3";
                }
                return "2";
            }
        },
        
        addRecountTask: async function(){
            BusyIndicator.show();
            let docBean = new Object();
            docBean.docInvId = this.byId("idConcInt").getSelectedKey();
            docBean.route = null;
            docBean.bukrs = null;
            docBean.bukrsD = null;
            docBean.werks = null;
            docBean.werksD = null;
            docBean.type = null;
            docBean.status = null;
            docBean.createdBy = null;
            
            let taskBean = new Object();
            taskBean.taskId = null;
            taskBean.groupId = this.groupId; 
            taskBean.docInvBean = docBean; 
            taskBean.taskJSON = ""// super bean del figue
            taskBean.dCreated= null;
            taskBean.dDownlad= null;
            taskBean.dUpload= null;
            taskBean.status = true;		
            taskBean.rub = await this.generateBean();
            
            if(taskBean.rub.positions.length == 0){
                MessageBox.show('Los datos de conteo en tarea se encuentran vacíos.\nFavor de intentar nuevamente',
                        MessageBox.Icon.ERROR, "Error");
                
                BusyIndicator.hide();
                return;
            }
            
            taskBean.recount = await this.getRecount();
            let taskFather = await this.getFatherTaskByDocId();
            if(!taskFather){
                return;
            }
            taskBean.taskIdFather = taskFather.taskId;//servicio de eric;
             
            const request = {
                tokenObject: null,
                lsObject: taskBean
            };

            const json = await this.execService(InveServices.ADD_TASK,request,"addRecountTask",this.showLog);

			if(json){
                
                this.byId("bCount").setEnabled(false);
                
                let taskId = json.lsObject.taskId;
                
                this.message('Se generó la tarea para reconteo exitosamente con Id: ' + taskId ,MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pConciliation"));
                
                setTimeout(function() {
                    this.byId("messagesBox").getItems()[0].close();
                }.bind(this),3000);
                BusyIndicator.hide();
            }
            
        },
        //getSpecialTask se usa para generar la Tarea de reconteo diario
        getSpecialTask: async function(){
            
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
            taskBean.groupId = this.groupId; 
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
            const json = await this.execService(InveServices.GET_SPECIAL_COUNT,request,"getSpecialCount",this.showLog);

			if(json){
                BusyIndicator.hide();
                let taskId = json.lsObject.taskId;
                
                this.message('Se generó la tarea para conteo especial exitosamente con Id: ' + taskId ,MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pConciliation"));
                
                setTimeout(function() {
                    this.byId("messagesBox").getItems()[0].close();     
                }.bind(this),3000);
            }
            
        },
        
        recount: function(){
            this.flagSpecial = false;
            this.showModalAvailableGroups();
        },
        specialCount: function(){
            this.flagSpecial = true;
            this.showModalAvailableGroups();
        },
        
        showModalAvailableGroups: function(){		
            this.groupId = undefined;
            let oView = this.getView();
            if (!this.byId("oDialogAssignTo")) {
    
                Fragment.load({
                    id: oView.getId(),
                    name: "com.bmore.inveweb.view.fragments.vMCAssignTo",
                    controller: this
                  }).then(function(oDialog){
                    oView.addDependent(oDialog);
                    this.frgById("fSearchAssignTo").setValue("");
                    this.frgById("oTableAsignTo").setModel(new JSONModel([]),"asignToModel");
                    oDialog.open();
                  }.bind(this));
            }else{
                this.frgById("fSearchAssignTo").setValue("");
                this.frgById("oTableAsignTo").setModel(new JSONModel([]),"asignToModel");
                this.byId("oDialogAssignTo").open();
            }
            
        },
        searchAsignTo: function(evt){
            if(evt.getParameters().clearButtonPressed){
                return;
            }
            BusyIndicator.show(0);
            let search = this.frgById("fSearchAssignTo").getValue().trim();

                if(search == "" || search.length == 0){
                    MessageBox.show('Favor de ingresar el id de red (VDI) o nombre completo del contador',
                                MessageBox.Icon.ERROR, "Error");
                        BusyIndicator.hide();
                    return;
                }
                this.loadLDAP_Users(search);
            
        },
        loadLDAP_Users: async function (user){	
            let  oTableAsignTo = this.frgById("oTableAsignTo");
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
                
                oTableAsignTo.setModel(new JSONModel(arr) ,"asignToModel");
                BusyIndicator.hide();  
            }
        },
        selectAssignTo: async function(oEvent){
            
            let listItems = oEvent.getParameters().listItem;
            let agreggation = listItems.mAggregations;
            let  cells = agreggation.cells;
           // let oTableAsignTo = Fragment.byId(this.idFrgAssignTo, "oTableAsignTo");
            let row = {
                id : cells[0].getText(),
                desc : cells[1].getText()
            }
            this.groupId = row.id;
            if(this.groupId != undefined && this.flagSpecial == false){							
                this.addRecountTask();
            }else if(this.groupId != undefined && this.flagSpecial == true){
                this.flagSpecial = false;
                this.getSpecialTask();
            }

            this._closeDialog();
            		
        },
        _closeDialog:function(){
            this.byId("oDialogAssignTo").close();
        },
        frgById:function(id){
            return Fragment.byId(this.getView().getId(), id);
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
        
        closeInvDoc: function(){
            let doc = this.byId("idConcInt").getSelectedKey();
            MessageBox.confirm(
                     "¿Desea cerrar el documento interno " + doc + " ?", {
                          icon: MessageBox.Icon.QUESTION,
                          actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                          onClose: function(oAction) { 
                              
                            if(oAction == 'YES'){
                                this.execCloseInvDoc(this.prepareModelToConciliate());
                            }  			        	  			        	  
                        }.bind(this)						
                    }
                );
            
        },

        execCloseInvDoc: async function(modelToConciliate){
            
            const request = {
                tokenObject: null,
                lsObject: modelToConciliate
            };

            const json = await this.execService(InveServices.CONCI_DOC_INV,request,"execCloseInvDoc",this.showLog);

			if(json){
                BusyIndicator.hide();
                this.message('Documento de Inventario cerrado exitosamente.',MessageType.Success,this.byId("messagesBox"),this.byId("vbFrame"),this.byId("pConciliation"));
                
                setTimeout(function() {
                    this.byId("messagesBox").getItems()[0].close(); 
                    this.refresh();
                }.bind(this),3000);
            }
        },
        
        exportConciliation: function(){
            let modelData = this.byId("oTable").getModel("oModel").getData();
            if(modelData == undefined || modelData.length == 0){
                MessageBox.show('Sin información para exportar.',
                        MessageBox.Icon.ERROR, "Sin datos");
                return;
            }
           
        
            let oExport;
            if(this.type== "1" && !this.flagCountE){
                oExport = new Export({
    
                    exportType: new ExportTypeCSV({
                        fileExtension: "csv",
                        separatorChar: this.getCharSeparator()
                    }),
    
                    models: new JSONModel(modelData),
    
                    rows: {
                        path: "/"
                    },
                    
                    columns: [
                    {name: "Almacén",template: {content: "{lgort}"}}
                    , {name: "Zona",template: {content: "{zoneD}"}}
                    , {name: "Ubicación", template: {content: "{lgpla}"}}
                    , {name: "Material", template: {content: "{matnr}"}}
                    , {name: "Descripción", template: {content: "{matnrD}"}}
                    , {name: "Fecha Inicio", template: {content: "{dateIni}"}}
                    , {name: "Fecha Fin", template: {content: "{dateEnd}"}}
                    , {name: "Unidad de Medida", template: { content: "{measureUnit}" }}
                    , {name: "Conteo", template: { content: "{count1A}"}}
                    , {name: "Tarima", template: { content: "{vhilm}"}}
                    , {name: "Conteo de Tarima", template: { content: "{vhilmCount}"}}
                    , {name: "Fecha", template: {content: "{prodDate}"}}
                    , {name: "Nota", template: {content: "{note}"}}
                    , {name: "Lote", template: {content: "{lote}"}}
                    ]
                });
            }else if(this.type == "1" && this.flagCountE){
                
                oExport = new Export({
    
                    exportType: new ExportTypeCSV({
                        fileExtension: "csv",
                        separatorChar: this.getCharSeparator()
                    }),
    
                    models: new JSONModel(modelData),
    
                    rows: {
                        path: "/"
                    },
                    
                    columns: [
                    {name: "Almacén",template: {content: "{lgort}"}}
                    , {name: "Zona",template: {content: "{zoneD}"}}
                    , {name: "Ubicación", template: {content: "{lgpla}"}}
                    , {name: "Material", template: {content: "{matnr}"}}
                    , {name: "Descripción", template: {content: "{matnrD}"}}
                    , {name: "Fecha Inicio", template: {content: "{dateIni}"}}
                    , {name: "Fecha Fin", template: {content: "{dateEnd}"}}
                    , {name: "Unidad de Medida", template: { content: "{measureUnit}" }}
                    , {name: "Conteo", template: { content: "{count1A}"}}
                    , {name: "Tarima", template: { content: "{vhilm}"}}
                    , {name: "Conteo de Tarima", template: { content: "{vhilmCount}"}}
                    , {name: "Conteo Especial", template: { content: "{countX}" }}
                    , {name: "Fecha", template: {content: "{prodDate}"}}
                    , {name: "Nota", template: {content: "{note}"}}
                    , {name: "Lote", template: {content: "{lote}"}}
                    ]
                });
                
            }else if(this.type == "2"){
                oExport = new Export({
    
                    exportType: new ExportTypeCSV({
                        fileExtension: "csv",
                        separatorChar: this.getCharSeparator()
                    }),
    
                    models: new JSONModel(modelData),
    
                    rows: {
                        path: "/"
                    },
                    
                    columns: [
                    {name: "Almacén",template: {content: "{lgort}"}}
                    , {name: "Zona",template: {content: "{zoneD}"}}
                    , {name: "Ubicación", template: {content: "{lgpla}"}}
                    , {name: "Material", template: {content: "{matnr}"}}
                    , {name: "Descripción", template: {content: "{matnrD}"}}
                    , {name: "Fecha Inicio", template: {content: "{dateIni}"}}
                    , {name: "Fecha Fin", template: {content: "{dateEnd}"}}
                    , {name: "Unidad de Medida", template: { content: "{measureUnit}" }}
                    , {name: "Conteo 1A", template: { content: "{count1A}"}}
                    , {name: "Conteo 1B", template: { content: "{count1B}" }}
                    , {name: "Diferencia", template: { content: "{dif1}" }}
                    , {name: "Conteo 2", template: { content: "{count2}" }}
                    , {name: "Diferencia", template: { content: "{dif2}" }}
                    , {name: "Conteo 3", template: { content: "{count3}" }}
                    , {name: "Conteo Especial", template: { content: "{countX}" }}
                    , {name: "Tarima", template: { content: "{vhilm}"}}
                    , {name: "Conteo de Tarima", template: { content: "{vhilmCount}"}}
                    , {name: "Fecha", template: {content: "{prodDate}"}}
                    , {name: "Nota", template: {content: "{note}"}}
                    , {name: "Lote", template: {content: "{lote}"}}
                    , {name: "ISC", template: { content: "{isc}" }}
                    
                    ]
                });
            }
            
            oExport.saveFile("Conciliación-"+this.byId("idConc").getSelectedItem().
                getKey()+" Int-"+this.byId("idConcInt").getSelectedItem().
                    getKey()).catch(function(oError) {
                
                        console.error("Error al exportar csv",oError);
            }).then(function() {
                oExport.destroy();
                
            }); 
        },
        
        prepareModelToConciliate: function(){
            
            let docInvBean = new Object();
            
            docInvBean.docInvId  = parseInt(this.byId("idConc").getSelectedKey());
            docInvBean.docInvRelId = parseInt(this.byId("idConcInt").getSelectedKey());
            docInvBean.bukrs = this.byId("bukrs").getValue().split(" - ")[0];
            docInvBean.werks = this.byId("werks").getValue().split(" - ")[0];
            docInvBean.type = this.type;
            docInvBean.sapRecount = this.sapRecount;
            docInvBean.route = null; 
            docInvBean.bukrsD = null;	
            docInvBean.werksD = null;
            docInvBean.createdBy = null;
            docInvBean.status = "0";
            
            let arrPositions = [];
            
            let positionsDocInv = this.oModel.getData();
            
            console.log("modelo Tabla",positionsDocInv);
            for(let i in positionsDocInv){
                
                let docInvPosition = new Object();
                
                docInvPosition.docInvId = parseInt(this.byId("idConcInt").getSelectedKey());
                docInvPosition.lgort = null;
                docInvPosition.lgtyp = null;
                docInvPosition.lgpla = positionsDocInv[i].lgpla;
                docInvPosition.matnr = positionsDocInv[i].matnr;
                docInvPosition.theoric = null;
                docInvPosition.Cpc = positionsDocInv[i].Cpc;
                docInvPosition.Cpp = positionsDocInv[i].Cpp;
                docInvPosition.build = positionsDocInv[i].build;
                docInvPosition.note =  positionsDocInv[i].note;
                docInvPosition.prodDate = positionsDocInv[i].prodDate;
                docInvPosition.CVal = positionsDocInv[i].CVal;
                docInvPosition.cValT = positionsDocInv[i].cValT;
                
                docInvPosition.diffCounted = null;
                docInvPosition.flag = null;
                docInvPosition.meins = null;
                docInvPosition.explosion = null;
                docInvPosition.zoneId = parseInt(positionsDocInv[i].zoneId);
                
                if(positionsDocInv[i].dateIni != undefined && positionsDocInv[i].dateIni.length > 1){
                    docInvPosition.dateIni = positionsDocInv[i].dateIni;
                }
                if(positionsDocInv[i].dateEnd != undefined && positionsDocInv[i].dateEnd.length > 1){
                    docInvPosition.dateEnd = positionsDocInv[i].dateEnd;
                }
                docInvPosition.vhilmCount = positionsDocInv[i].vhilmCount;
                docInvPosition.vhilm = positionsDocInv[i].vhilm;
                if(this.type == "1"){
                    if(this.flagCountE && positionsDocInv[i].countX != undefined && positionsDocInv[i].countType == 4){
                        docInvPosition.counted = positionsDocInv[i].countX.replace(/,/g, "");
    
                    }else if(this.flagCountA && positionsDocInv[i].count1A != undefined){
                        docInvPosition.counted = positionsDocInv[i].count1A.replace(/,/g, "");
                    }
    
                    
                }else{
                    if(this.flagCountE && positionsDocInv[i].countX != undefined && positionsDocInv[i].countType == 4){
                        docInvPosition.counted = positionsDocInv[i].countX.replace(/,/g, "");
    
                    }else if(this.flagCount3 && positionsDocInv[i].count3 != undefined && positionsDocInv[i].countType == 3){
                        
                        docInvPosition.counted = positionsDocInv[i].count3.replace(/,/g, "");
    
                    }else if(this.flagCount2 && positionsDocInv[i].count2 != undefined && positionsDocInv[i].countType == 2){
                        
                        docInvPosition.counted = positionsDocInv[i].count2.replace(/,/g, "");
    
                    }else if(this.flagCountA && this.flagCountB){
    	
                        if(positionsDocInv[i].count1A == positionsDocInv[i].count1B){
    	
                            docInvPosition.counted = positionsDocInv[i].count1A.replace(/,/g, "");
                            }else {
                                console.error("[prepareModelToConciliate] No deberia conciliar, conteos A y B son diferentes en carril "+positionsDocInv[i].lgpla);
                            }
                        
                    }
                }
                
                arrPositions.push(docInvPosition);
                
            }
            console.log("[prepareModelToConciliate] Conciliate arrPositions",arrPositions);
            docInvBean.docInvPositions = arrPositions;
                    
            return docInvBean;
            
        },
        
        filterC1: function(){
            BusyIndicator.show();
            let oTable = this.byId("oTable");
            
            oTable.setModel(this.oModel,"oModel");
            this.colorRows();
            this.byId("idCount2C").setVisible(false);
            this.byId("idDif2C").setVisible(false);
            this.byId("idCount3C").setVisible(false);
            this.byId("idCountXC").setVisible(false);
            this.byId("idIscC").setVisible(true);
            
            this.byId("bCount1Filter").setType(ButtonType.Emphasized);
            this.byId("bCount2Filter").setType(ButtonType.Default);
            this.byId("bCount3Filter").setType(ButtonType.Default);
            this.byId("bCountEFilter").setType(ButtonType.Default);
            BusyIndicator.hide();
        },
        
        filterC2: function(){
            BusyIndicator.show();
            let oTable = this.byId("oTable");
            oTable.setModel(this.oModelC2,"oModel");
            this.colorRows();
            this.byId("idCount2C").setVisible(true);
            this.byId("idDif2C").setVisible(true);
            this.byId("idCount3C").setVisible(false);
            this.byId("idCountXC").setVisible(false);
            this.byId("idIscC").setVisible(true);
            
            this.byId("bCount1Filter").setType(ButtonType.Default);
            this.byId("bCount2Filter").setType(ButtonType.Emphasized);
            this.byId("bCount3Filter").setType(ButtonType.Default);
            this.byId("bCountEFilter").setType(ButtonType.Default);
            BusyIndicator.hide();
        },
        
        filterC3: function(){
            BusyIndicator.show();
            let oTable = this.byId("oTable");
            
            oTable.setModel(this.oModelC3,"oModel");
            this.colorRows();
            this.byId("idCount2C").setVisible(true);
            this.byId("idDif2C").setVisible(true);
            this.byId("idCount3C").setVisible(true);
            this.byId("idCountXC").setVisible(false);
            this.byId("idIscC").setVisible(false);
            
            this.byId("bCount1Filter").setType(ButtonType.Default);
            this.byId("bCount2Filter").setType(ButtonType.Default);
            this.byId("bCount3Filter").setType(ButtonType.Emphasized);
            this.byId("bCountEFilter").setType(ButtonType.Default);
            BusyIndicator.hide();
        },
        
        filterCE: function(){
            BusyIndicator.show();
            let oTable = this.byId("oTable");
            
            oTable.setModel(this.oModelCE,"oModel");
            this.colorRows();
            if(this.type == "1"){
                this.byId("idCount2C").setVisible(false);
                this.byId("idDif2C").setVisible(false);
                this.byId("idCount3C").setVisible(false);
                this.byId("idCountXC").setVisible(true);
                this.byId("bCountEFilter").setVisible(false);
            }else{
                this.byId("idCount2C").setVisible(true);
                this.byId("idDif2C").setVisible(true);
                this.byId("idCount3C").setVisible(true);
                this.byId("idCountXC").setVisible(true);
            }
            this.byId("idIscC").setVisible(false);
            this.byId("bCount1Filter").setType(ButtonType.Default);
            this.byId("bCount2Filter").setType(ButtonType.Default);
            this.byId("bCount3Filter").setType(ButtonType.Default);
            this.byId("bCountEFilter").setType(ButtonType.Emphasized);
            BusyIndicator.hide();
        },
        
        colorRows : function() {
            setTimeout(function() {
                
                let oTable = this.byId("oTable");
              
                let modelData = oTable.getModel("oModel").getData();
                for(let i in modelData){
                    if(modelData[i].flagColor){
                        modelData[i].state="Warning";
                    }
                }
                oTable.getModel("oModel").refresh(true);
                }.bind(this),100);
            
            },
            
            massiveClose: function(){
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
            
            getCompleteReport: async function(){
                
                const request = {
                    tokenObject: null,
                    lsObject: this.byId("idConc").getSelectedKey()
                };

                const json = await this.execService(InveServices.GET_COMPLETE_COUNTED_REPORT_DIALY,request,"getCompleteReport",this.showLog);

                if(json){
                    this.byId("idComplteReport").setEnabled(true);
                    BusyIndicator.hide();
                        //downloadCompleteReport
                    console.log("completeReport",json.lsObject);
                    this.downloadCompleteReport(json.lsObject.positions);
                }
                
            },
            
            downloadCompleteReport: function(modelData){
    
                if(modelData == undefined || modelData.length == 0){
                    MessageBox.show('Sin información para exportar.',
                            MessageBox.Icon.ERROR, "Sin datos");
                    return;
                }
                let model = new JSONModel(modelData);
                let oExport;
                
                oExport = new Export({
    
                    exportType: new ExportTypeCSV({
                        fileExtension: "csv",
                        separatorChar: this.getCharSeparator()
                    }),
    
                    models: model,
    
                    rows: {
                        path: "/"
                    },
                    
                    columns: [
                    {name: "Almacén",template: {content: "{lgort}"}}
                    , {name: "Zona",template: {content: "{zoneD}"}}
                    , {name: "Ubicación", template: {content: "{lgpla}"}}
                    , {name: "Material", template: {content: "{matnr}"}}
                    , {name: "Descripción", template: {content: "{matnrD}"}}
                    , {name: "Fecha Inicio", template: {content: "{dateIni}"}}
                    , {name: "Fecha Fin", template: {content: "{dateEnd}"}}
                    , {name: "Unidad de Medida", template: { content: "{measureUnit}" }}
                    , {name: "Conteo", template: { content: "{count1A}"}}
                    , {name: "Conteo Especial", template: { content: "{countX}"}}
                    , {name: "Tarima", template: { content: "{vhilm}"}}
                    , {name: "Conteo de Tarima", template: { content: "{vhilmCount}"}}
                    , {name: "Fecha", template: {content: "{prodDate}"}}
                    , {name: "Nota", template: {content: "{note}"}}
                    ]
                });
            
                
                oExport.saveFile("ConciliaciónCompleta - "+this.byId("idConc").getSelectedItem().getKey()).catch(function(oError) {
                    console.error("Error al exportar csv", oError);
                }).then(function() {
                    oExport.destroy();
                    
                }); 
            
            },

            configTable: function(){

                let modelConfigTable = [];
                let columns = this.byId("oTable").getColumns();
                for(let i in columns){
                    let item = new Object();
                    item.text = columns[i].getHeader().getText();
                    item.visible = columns[i].getVisible();
                    modelConfigTable.push(item);
                }
                if(!this.defaultModel){
                    this.defaultModel = this.copyObjToNew(modelConfigTable);
                }
                
                this.modelConfigTable = modelConfigTable;

                let oView = this.getView();
                if (!this.byId("oDialogConfigTable")) {
        
                    Fragment.load({
                        id: oView.getId(),
                        name: "com.bmore.inveweb.view.fragments.vMCConfigTable",
                        controller: this
                      }).then(function(oDialog){
                        oView.addDependent(oDialog);	
                        this.frgById("oConfigTable").setModel(new JSONModel(this.modelConfigTable),"oModel");
                        oDialog.open();
                      }.bind(this));
                }else{
                    this.frgById("oConfigTable").setModel(new JSONModel(this.modelConfigTable),"oModel");
                    this.byId("oDialogConfigTable").open();
                }

            },
            changeSwitch: function(evt){
                let text = evt.getSource().getParent().mAggregations.cells[1].getText();
                let columns = this.byId("oTable").getColumns();
                for(let i in columns){
                   if(text == columns[i].getHeader().getText()){
                        columns[i].setVisible(evt.getParameters().state);
                        break;
                   } 
                }
            },
            _closeDialogConfigTable:function(){
                this.byId("oDialogConfigTable").close();
            },

            restoreColumns: function(){

               let columns = this.byId("oTable").getColumns();
               for(let i in columns){
                    for(let j in this.defaultModel){
                        if(this.defaultModel[j].text == columns[i].getHeader().getText()){
                            columns[i].setVisible(this.defaultModel[j].visible);
                            break;
                        } 
                    }
                
                }
                this._closeDialogConfigTable();
            },

            filterCount: function(oEvent){
                let sQuery = oEvent.getSource().getValue();
                let oFilter = new Filter({
                  filters: [
                    new Filter("lgobe", FilterOperator.Contains, sQuery),
                    new Filter("zoneD", FilterOperator.Contains, sQuery),
                    new Filter("lgpla", FilterOperator.Contains, sQuery),
                    new Filter("matnr", FilterOperator.Contains, sQuery),
                    new Filter("measureUnit", FilterOperator.Contains, sQuery),
                  ],
                  and: false
                });
                let oBinding =  this.byId("oTable").getBinding("items");
                oBinding.filter(oFilter, FilterType.Application);
            },
      })
    }
);