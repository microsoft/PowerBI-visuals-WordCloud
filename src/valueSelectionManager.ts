/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

module powerbi.extensibility.visual {
    // powerbi.data
    import Selector = powerbi.data.Selector;

    // powerbi.extensibility
    import ISelectionManager = powerbi.extensibility.ISelectionManager;

    // powerbi.extensibility.visual
    import IVisualHost = powerbi.extensibility.visual.IVisualHost;

    // powerbi.visuals
    import ISelectionId = powerbi.visuals.ISelectionId;

    export class ValueSelectionManager<T> {
        private selectedValuesValue: T[] = [];
        private visualHost: IVisualHost;
        private getSelectionIds: (value: T | T[]) => ISelectionId[];
        private selectionManager: ISelectionManager;

        public constructor(visualHost: IVisualHost, getSelectionIds: (value: T) => ISelectionId[]) {
            this.visualHost = visualHost;
            this.selectionManager = visualHost.createSelectionManager();

            this.getSelectionIds = (value) => _.isArray(value)
                ? <ISelectionId[]>_.flatten((<T[]>value).map(x => getSelectionIds(x)))
                : getSelectionIds(<T>value);
        }

        public get selectedValues(): T[] {
            return this.selectedValuesValue;
        }

        public get selectionIds(): ISelectionId[] {
            return this.getSelectionIds(this.selectedValues);
        }

        public get hasSelection(): boolean {
            return this.selectedValues.length > 0;
        }

        public get getSelectionIdValues() {
            return this.selectedValues.map(v => { return { value: v, selectionId: this.getSelectionIds(v) }; });
        }

        public selectAndSendSelection(value: T[] | T, multiSelect: boolean = false): JQueryDeferred<ISelectionId[]> {
            var values = <T[]>(_.isArray(value) ? value : [value]);

            this.selectInternal(values, multiSelect);
            return this.sendSelection();
        }

        public select(value: T[] | T, multiSelect: boolean = false) {
            var values = <T[]>(_.isArray(value) ? value : [value]);
            this.selectInternal(values, multiSelect);
        }

        public isSelected(selectionId: T[] | T): boolean {
            var values = <T[]>(_.isArray(selectionId) ? selectionId : [selectionId]);
            return values.every(v => this.selectedValues.some(s => s === v));
        }

        public sendSelection(): JQueryDeferred<ISelectionId[]> {
            return this.sendSelectionToHost(this.selectionIds);
        }

        public clear(sendToHost: boolean): JQueryDeferred<{}> {
            this.selectedValues.length = 0;

            if (sendToHost) {
                return this.sendSelection();
            }

            return $.Deferred().resolve();
        }

        private selectInternal(values: T[], multiSelect: boolean) {
            var resultValues = [];

            if (this.isSelected(values)) {
                resultValues = multiSelect
                    ? this.selectedValues.filter(s => !values.some(v => v === s))
                    : this.selectedValues.length === values.length ? [] : values;
            } else {
                resultValues = multiSelect
                    ? values.filter(x => !this.isSelected(x)).concat(this.selectedValues)
                    : values;
            }

            this.selectedValues.length = 0;
            resultValues.forEach(x => this.selectedValues.push(x));
        }

        private sendSelectionToHost(ids: ISelectionId[]): JQueryDeferred<ISelectionId[]> {
            var deferred: JQueryDeferred<Selector[]> = $.Deferred();
            (<any>this.selectionManager).sendSelectionToHost(ids);
            deferred.resolve(this.selectionIds);

            return deferred;
        }
    }

}
