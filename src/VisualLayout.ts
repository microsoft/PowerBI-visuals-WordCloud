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

import powerbiVisualsApi from "powerbi-visuals-api";
import * as _ from "lodash";

import IViewport = powerbiVisualsApi.IViewport;

// powerbi.extensibility.utils.svg
import { IMargin } from "powerbi-visuals-utils-svgutils";

export class VisualLayout {
    private marginValue: IMargin;
    private viewportValue: IViewport;
    private viewportInValue: IViewport;
    private minViewportValue: IViewport;
    private originalViewportValue: IViewport;
    private previousOriginalViewportValue: IViewport;

    public defaultMargin: IMargin;
    public defaultViewport: IViewport;

    constructor(defaultViewport?: IViewport, defaultMargin?: IMargin) {
        this.defaultViewport = defaultViewport || { width: 0, height: 0 };
        this.defaultMargin = defaultMargin || { top: 0, bottom: 0, right: 0, left: 0 };
    }

    public get viewport(): IViewport {
        return this.viewportValue || (this.viewportValue = this.defaultViewport);
    }

    public get viewportCopy(): IViewport {
        return _.clone(this.viewport);
    }

    // Returns viewport without margin
    public get viewportIn(): IViewport {
        return this.viewportInValue || this.viewport;
    }

    public get minViewport(): IViewport {
        return this.minViewportValue || { width: 0, height: 0 };
    }

    public get margin(): IMargin {
        return this.marginValue || (this.marginValue = this.defaultMargin);
    }

    public set minViewport(value: IViewport) {
        this.setUpdateObject(
            value,
            (viewPoirt: IViewport) => this.minViewportValue = viewPoirt,
            VisualLayout.restrictToMinMax);
    }

    public set viewport(value: IViewport) {
        this.previousOriginalViewportValue = _.clone(this.originalViewportValue);
        this.originalViewportValue = _.clone(value);

        this.setUpdateObject(
            value,
            (viewport: IViewport) => this.viewportValue = viewport,
            (viewport: IViewport) => VisualLayout.restrictToMinMax<IViewport>(viewport, this.minViewport));
    }

    public set margin(value: IMargin) {
        this.setUpdateObject(
            value,
            (margin: IMargin) => this.marginValue = margin,
            VisualLayout.restrictToMinMax);
    }

    // Returns true if viewport has updated after last change.
    public get viewportChanged(): boolean {
        return !!this.originalViewportValue && (!this.previousOriginalViewportValue
            || this.previousOriginalViewportValue.height !== this.originalViewportValue.height
            || this.previousOriginalViewportValue.width !== this.originalViewportValue.width);
    }

    public get viewportInIsZero(): boolean {
        return this.viewportIn.width === 0 || this.viewportIn.height === 0;
    }

    public resetMargin(): void {
        this.margin = this.defaultMargin;
    }

    private update(): void {
        this.viewportInValue = VisualLayout.restrictToMinMax({
            width: this.viewport.width - (this.margin.left + this.margin.right),
            height: this.viewport.height - (this.margin.top + this.margin.bottom)
        }, this.minViewportValue);
    }

    private setUpdateObject<T>(object: T, setObjectFn: (T) => void, beforeUpdateFn?: (T) => void): void {
        object = _.clone(object);

        setObjectFn(VisualLayout.createNotifyChangedObject(object, () => {
            if (beforeUpdateFn) {
                beforeUpdateFn(object);
            }

            this.update();
        }));

        if (beforeUpdateFn) {
            beforeUpdateFn(object);
        }

        this.update();
    }

    private static createNotifyChangedObject<T>(object: T, objectChanged: (obj?: T, key?: string) => void): T {
        let result: T = <T>{};

        _.keys(object).forEach((key: string) => Object.defineProperty(result, key, {
            get: () => object[key],
            set: (value) => {
                object[key] = value;
                objectChanged(object, key);
            },
            enumerable: true,
            configurable: true
        }));

        return result;
    }

    private static restrictToMinMax<T>(value: T, minValue?: T): T {
        _.keys(value).forEach((key: string) => value[key] = Math.max(minValue && minValue[key] || 0, value[key]));

        return value;
    }
}
