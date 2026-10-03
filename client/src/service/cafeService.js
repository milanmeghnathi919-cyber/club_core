import barService from './barService'

export const cafeService = {
  ...barService,
  getMenuItems: barService.getMenu,
  createMenuItem: barService.createMenuItem,
  updateMenuItem: barService.updateMenuItem,
  deleteMenuItem: barService.deleteMenuItem,
  getCaféTables: barService.getTables,
  getCaféTabs: barService.getTabs,
  getKitchenQueue: barService.getKitchenQueue,
  updateKitchenStatus: barService.updateKitchenStatus,
  getCaféSummary: barService.getBarSummary,
}

export default cafeService
