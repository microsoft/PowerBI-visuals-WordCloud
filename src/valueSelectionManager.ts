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

    export interface SelectionIdValues<T> {
        value: T;
        selectionId: ISelectionId[];
    }

    export class ValueSelectionManager<T> {
        private selectedValuesValue: T[] = [];
        private visualHost: IVisualHost;
        private getSelectionIds: (value: T | T[]) => ISelectionId[];
        private selectionManager: ISelectionManager;

        public constructor(visualHost: IVisualHost, getSelectionIds: (value: T) => ISelectionId[]) {
            this.visualHost = visualHost;
            this.selectionManager = visualHost.createSelectionManager();

            this.getSelectionIds = (value: T | T[]) => _.isArray(value)
                ? <ISelectionId[]>_.flatten((value as T[]).map((valueElement: T) => {
                    return getSelectionIds(valueElement);
                }))
                : getSelectionIds(value);
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

        public get getSelectionIdValues(): SelectionIdValues<T>[] {
            return this.selectedValues.map((value: T) => {
                return {
                    value,
                    selectionId: this.getSelectionIds(value)
                };
            });
        }

        public selectAndSendSelection(value: T[] | T, multiSelect: boolean = false): void {
            const values: T[] = _.isArray(value)
                ? value
                : [value];

            this.selectInternal(values, multiSelect);

            this.sendSelection();
        }

        public isSelected(selectionId: T[] | T): boolean {
            const values: T[] = _.isArray(selectionId)
                ? selectionId
                : [selectionId];

            return values.every((value: T) => this.selectedValues.some((selectedValue: T) => {
                return selectedValue === value;
            }));
        }

        public sendSelection(): void {
            this.sendSelectionToHost(this.selectionIds);
        }

        public clear(sendToHost: boolean): void {
            this.selectedValues.length = 0;

            if (sendToHost) {
                this.sendSelection();
            }
        }

        private selectInternal(values: T[], multiSelect: boolean): void {
            let resultValues: T[];

            if (this.isSelected(values)) {
                resultValues = multiSelect
                    ? this.selectedValues.filter((selectedValue: T) => {
                        return !values.some((value: T) => value === selectedValue);
                    })
                    : this.selectedValues.length === values.length ? [] : values;
            } else {
                resultValues = multiSelect
                    ? values.filter((value: T) => {
                        return !this.isSelected(value);
                    }).concat(this.selectedValues)
                    : values;
            }

            this.selectedValues.length = 0;

            resultValues.forEach((value: T) => {
                this.selectedValues.push(value);
            });
        }

        private sendSelectionToHost(ids: ISelectionId[]): void {
            (<any>this.selectionManager).sendSelectionToHost(ids);

        }
    }
}
