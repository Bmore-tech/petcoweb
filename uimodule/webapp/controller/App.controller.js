/* eslint-disable no-console */
sap.ui.define(
  [
    "com/bmore/inveweb/controller/BaseController",
    "sap/ui/core/Fragment",
    "sap/tnt/NavigationListItem",
  ],
  function (Controller, Fragment, NavigationListItem) {
    "use strict";

    return Controller.extend("com.bmore.inveweb.controller.App", {
      onInit: function () {
        this.showLog = false;
        this.getCheckSession();
        
      },

      _closeSession: async function () {
        try {
          this.setSessionDataObject(undefined);
          this.navTo("Login");
          this.BusyIndicatorOff();
        } catch (error) {
          this.showAlert(error, "ERROR");
        }
      },
      _logOut: function () {
        this.setSessionDataObject(undefined);
        this.byId("nvlContainer").setSelectedKey(null);
        this.byId("nvlContainer").destroyItems();
        this.INIT_ENTRY_ROLE = undefined;
        this.navTo("Login");
        location.reload();
       
      },
      closeSessionMessage: async function () {
        try {
          this.navTo("Login");
          this.BusyIndicatorOff();
          setTimeout(
            function () {
              console.warn("Sin sesión");
            },
            500
          );
        } catch (error) {
          this.showAlert(error.toString(), "ERROR");
        }
      },
      getCheckSession: async function () {
        if (this.getSessionDataObject() != undefined) {
          let json = await this.execService(InveServices.CHECKSESSION, null, "getCheckSession", this.showLog);
          if (json) {
            sap.ui.getCore().byId("container-inveweb---idAppControl--avatar").setInitials(this.getUserInitials());
            this.addEntryByRole();
            this.navTo("Home");
          }
        } else {
          this.navTo("Login");
        }


      },


      loginNavbar: function () {
        this.byId("sideNavigation").setVisible(false);
        this.byId("app").setSideExpanded(false);
        this.byId("avatar").setVisible(false);
        this.byId("shell_bar_app").setShowMenuButton(false);
        this.byId("shell_bar_app").setShowNavButton(false);
        this.byId("shell_bar_app").setShowProductSwitcher(false);
      },
      homeNavbar: function () {
        this.byId("sideNavigation").setVisible(true);
        this.byId("app").setSideExpanded(false);
        this.byId("avatar").setVisible(true);
        this.byId("shell_bar_app").setShowMenuButton(true);
        this.byId("shell_bar_app").setShowNavButton(false);
        this.byId("shell_bar_app").setShowProductSwitcher(false);
      },
      dashboardFrescuraNavbar: function () {
        this.byId("sideNavigation").setVisible(true);
        this.byId("app").setSideExpanded(true);
        this.byId("avatar").setVisible(true);
        this.byId("shell_bar_app").setShowMenuButton(true);
        this.byId("shell_bar_app").setShowNavButton(false);
        this.byId("shell_bar_app").setShowProductSwitcher(false);

      },
      onNav: function (oEvent) {
        //console.log(oEvent.getParameter("selectedKey"));
        this.getRouter().navTo(oEvent.getParameter("selectedKey"));

      },
      loadHome: function () {
        this.navTo("Home");
      },
      _goDocumentoFrescura: function () {
        console.log("documento");
      },
      _goToDashboardFrescura: function () {
        this.navTo("inventarioPT");
        console.log("dashboard");
      },
      onSideNavButtonPress: function () {
        let oToolPage = this.byId("app");
        oToolPage.setSideExpanded(!oToolPage.getSideExpanded());
      },

      _closeSideExpanded: function () {
        this.byId("app").setSideExpanded(false);
      },
      handlePopoverPress: function () {
        let oButton = this.byId("avatar");
        
        let sMsg = this.getUserFullName().toUpperCase();
        // create popover
        if (!this._oPopoverUser) {
          Fragment.load({
            name: "com.bmore.inveweb.view.fragments.user",
            controller: this,
          }).then(
            function (pPopover) {
              this._oPopoverUser = pPopover;
              this.getView().addDependent(this._oPopoverUser);
              this._oPopoverUser.openBy(oButton);
              this._oPopoverUser.setTitle(sMsg);
            }.bind(this)
          );
        } else {
          this._oPopoverUser.openBy(oButton);
          this._oPopoverUser.setTitle(sMsg);
        }
      },

      addEntryByRole: function () {
        if (this.INIT_ENTRY_ROLE) {
          return;
        }
        let nvliContainer = this.byId("nvlContainer");

        let nvliHome = new NavigationListItem({
          id: "nvliHome", // sap.ui.core.ID
          text: "Home", // string
          icon: "sap-icon://home", // sap.ui.core.URI "sap-icon://journey-change"
          select: function () {
            this.loadHome();
          }.bind(this),
        });
        nvliContainer.addItem(nvliHome);

        if (this.roleExists("EXECUTE_INV_CIC_CONSOLE") ||
          this.roleExists("INV_CIC_ADMIN")) {
          let nvliRoute = new NavigationListItem({
            id: "nvliRoute", // sap.ui.core.ID
            text: "Gestión Inventarios", // string
            icon: "sap-icon://crm-service-manager", // sap.ui.core.URI "sap-icon://journey-change"
            expanded: false, // boolean
          });

          let nvliGestionFrescura = new NavigationListItem({
            id: "nvliGestionFrescura", // sap.ui.core.ID
            text: "Gestión Frescura", // string
            icon: "sap-icon://heating-cooling", // sap.ui.core.URI "sap-icon://journey-change"
            expanded: false, // boolean
          });

          let nvliAdminRoute = new NavigationListItem({
            id: "nvliAdminRoute", // sap.ui.core.ID
            text: "Rutas", // string
            select: function (oEvent) {
              this.navTo("rutas");
            }.bind(this),
          });

          let nvliAdminZone = new NavigationListItem({
            id: "nvliAdminZone", // sap.ui.core.ID
            text: "Zonas", // string
            select: function () {
              this.navTo("zone");
            }.bind(this),
          });

          let nvliConciliation = new NavigationListItem({
            id: "nvliConciliation", // sap.ui.core.ID
            text: "Conciliación", // string
            select: function (oEvent) {
              this.navTo("conciliation");
            }.bind(this),
          });

          let nvliInvDocument = new NavigationListItem({
            id: "nvliInvDocument",
            text: "Documento de Inventario",
            select: function (oEvent) {
              this.navTo("docInv");
            }.bind(this),
          });

          let nvliConcSap = new NavigationListItem({
            id: "nvliConcSap",
            text: "Conciliación SAP",
            select: function (oEvent) {
              this.navTo("conciSap");
            }.bind(this),
          });

          let nvliDocFrescura = new NavigationListItem({
            id: "nvliDocFrescura",
            text: "Documento Frescura",
            select: function (oEvent) {
              this.navTo("vDocFrescura");
            }.bind(this),
          });
          let nvliDashboardFrescura;
         
          nvliDashboardFrescura = new NavigationListItem({
            id: "nvliDashboardFrescura",
            text: "Dashboard Frescura",
            select: function (oEvent) {
              this.navTo("vDashboardFrescura");
            }.bind(this),
          });
          /*if(this.roleExists("INVE_MX")){//UNICAMENTE ES PARA MEXICO QUE VEAN DASHBOARD FRESCURA
            
          }*/
          

          let nvliTypeWareHouse = new NavigationListItem({
            id: "nvliTypeWareHouse",
            text: "Tipo de Almacén",
            select: function () {
              this.navTo("tipoAlmacen");
            }.bind(this),
          });

          nvliRoute.addItem(nvliTypeWareHouse);
          nvliRoute.addItem(nvliAdminZone);
          nvliRoute.addItem(nvliAdminRoute);
          nvliRoute.addItem(nvliInvDocument);
        
          nvliRoute.addItem(nvliConciliation);
          nvliRoute.addItem(nvliConcSap);
          nvliContainer.addItem(nvliRoute);

          nvliGestionFrescura.addItem(nvliDocFrescura);
          nvliGestionFrescura.addItem(nvliDashboardFrescura);
          /*if(this.roleExists("INVE_MX")){//UNICAMENTE ES PARA MEXICO QUE VEAN DASHBOARD FRESCURA
            
          }*/
          

          let nvliCatalogues = new NavigationListItem({
            id: "nvliCatalogues", // sap.ui.core.ID
            text: "Catálogos", // string
            icon: "sap-icon://course-book", // sap.ui.core.URI
            expanded: false, // boolean
          });

          let nvliMaterialCatalog = new NavigationListItem({
            id: "nvliMaterialCatalog", // sap.ui.core.ID
            text: "Materiales", // string
            select: function (oEvent) {
              this.navTo("materiales");
            }.bind(this),
          });

          let nvliPreciosMatnr = new NavigationListItem({
            id: "nvliPreciosMatnr", // sap.ui.core.ID
            text: "Precios de Materiales", // string
            select: function (oEvent) {
              this.navTo("vPriceMatnr");
            }.bind(this),
          });

          let nvliExplosion = new NavigationListItem({
            id: "nvliExplosion", // sap.ui.core.ID
            text: "Explosión de Materiales", // string
            icon: "sap-icon://example", // sap.ui.core.URI
            select: function (oEvent) {
              this.navTo("vExplosion");
            }.bind(this),
          });

          let nvliClassificationSystem = new NavigationListItem({
            id: "nvliClassificationSystem",
            text: "Sistema de Clasificación",
            select: function (oEvent) {
              this.navTo("systemClass");
            }.bind(this),
          });

          let nvliValuationClass = new NavigationListItem({
            id: "nvliValuationClass",
            text: "Clase de Valuación",
            select: function (oEvent) {
              this.navTo("valuationClass");
            }.bind(this),
          });

          let nvliJustification = new NavigationListItem({
            id: "nvliJustification",
            text: "Justificaciones",
            select: function (oEvent) {
              this.navTo("justifiCat");
            }.bind(this),
          });

          let nvliCategory = new NavigationListItem({
            id: "nvliCategory",
            text: "Categorías",
            select: function (oEvent) {
              this.navTo("category");
            }.bind(this),
          });

          let nvliReturnableValuation = new NavigationListItem({
            id: "nvliReturnableValuation",
            text: "Valoración de Retornables",
            select: function (oEvent) {
              this.navTo("returnableValuation");
            }.bind(this),
          });
          var nvliUrban;
          if(this.roleExists("INVE_MX")){
            nvliUrban = new NavigationListItem({
              id: "nvliUrban", // sap.ui.core.ID
              text: "Urban", // string
              select: function (oEvent) {
                this.navTo("urban");
              }.bind(this),
            });
          }
          
          var nvliMultiAlmacen;
          if(this.roleExists("INVE_CO")){
            nvliMultiAlmacen = new NavigationListItem({
              id: "nvliMultiAlmacen", // sap.ui.core.ID
              text: "Multi-Almacén Centros", // string
              select: function (oEvent) {
                this.navTo("multiAlmacen");
              }.bind(this),
            });
          }
          

          let nvliDRV = new NavigationListItem({
            id: "nvliDRV", // sap.ui.core.ID
            text: "Administrar DRV´s", // string
            select: function (oEvent) {
              this.navTo("vManageDRV");
            }.bind(this),
          });

          let nvliContingencyTask = new NavigationListItem({
            id: "nvliContingencyTask", // sap.ui.core.ID
            text: "Tarea de Contingencia", // string
            select: function (oEvent) {
              this.navTo("vContingencyTask");
            }.bind(this),
          });
          var nvliReglasFrescura;
          if(this.roleExists("REGLAS_FRESCURA")){
            nvliReglasFrescura = new NavigationListItem({
              id: "nvliReglasFrescura", // sap.ui.core.ID
              text: "Reglas Frescura", // string
              select: function (oEvent) {
                this.navTo("vReglasFrescura");
              }.bind(this),
            });
          }
          

          let nvliDashboard = new NavigationListItem({
            id: "nvliDashboard", // sap.ui.core.ID
            text: "Dashboard", // string
            icon: "sap-icon://business-objects-experience", // sap.ui.core.URI
            expanded: false, // boolean
          });

          let nvliAlpha = new NavigationListItem({
            id: "nvliAlpha", // sap.ui.core.ID
            text: "Dashboard", // string
            select: function (oEvent) {
              this.navTo("vAlpha");
            }.bind(this),
          });

          let nvliSystemConfig = new NavigationListItem({
            id: "nvliSystemConfig", // sap.ui.core.ID
            text: "Configuración del Sistema", // string
            icon: "sap-icon://action-settings", // sap.ui.core.URI
            expanded: false, // boolean
          });

          let nvliProperties = new NavigationListItem({
            id: "nvliProperties", // sap.ui.core.ID
            text: "Propiedades", // string
            select: function (oEvent) {
              this.navTo("vRepository");
            }.bind(this),
          });

          nvliCatalogues.addItem(nvliMaterialCatalog);
          nvliCatalogues.addItem(nvliPreciosMatnr);

          nvliCatalogues.addItem(nvliClassificationSystem);
          nvliCatalogues.addItem(nvliExplosion);
          nvliCatalogues.addItem(nvliValuationClass);
          nvliCatalogues.addItem(nvliJustification);
          nvliCatalogues.addItem(nvliCategory);
     
          nvliCatalogues.addItem(nvliReturnableValuation);
          if(this.roleExists("INVE_MX")){
            nvliCatalogues.addItem(nvliUrban);
          }
          if(this.roleExists("INVE_CO")){
            nvliCatalogues.addItem(nvliMultiAlmacen);
          }
          
          nvliCatalogues.addItem(nvliDRV);
          nvliCatalogues.addItem(nvliContingencyTask);
         if(this.roleExists("REGLAS_FRESCURA")){
            nvliCatalogues.addItem(nvliReglasFrescura);
         }
          
          nvliContainer.addItem(nvliCatalogues);
          nvliContainer.addItem(nvliGestionFrescura);
          nvliDashboard.addItem(nvliAlpha);
          nvliContainer.addItem(nvliDashboard);//VER DASHBOARD
          nvliSystemConfig.addItem(nvliProperties);
          nvliContainer.addItem(nvliSystemConfig);

        this.INIT_ENTRY_ROLE = true;
          }
      }
    });
  }
);
