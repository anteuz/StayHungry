/*
 Simple item to be stored for re-use in shopping lists and in recipes
 */
export class SimpleItem {
    public usageCount: number;
    public lastUsed: number;
    
    constructor(public uuid: string, public itemName: string, public itemColor, usageCount: number = 0) {
        this.usageCount = usageCount;
        this.lastUsed = Date.now();
    }
}
