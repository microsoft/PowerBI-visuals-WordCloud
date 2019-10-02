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
// powerbi.visuals
import powerbiVisualsApi from "powerbi-visuals-api";
import DataView = powerbiVisualsApi.DataView;
import ISelectionId = powerbiVisualsApi.visuals.ISelectionId;

// powerbi.extensibility.utils.svg
import { shapesInterfaces } from "powerbi-visuals-utils-svgutils";
import IPoint = shapesInterfaces.IPoint;

import { WordCloudSettings } from "./settings";

export interface WordCloudText {
    text: string;
    textGroup: string;
    count: number;
    index: number;
    selectionId: ISelectionId;
    color: string;
}

export interface WordCloudGroup {
    text: string;
    count: number;
    wordIndex: number;
    selectionIds: ISelectionId[];
    color: string;
}

export interface WordCloudDataPoint extends IPoint {
    text: string;
    xOff: number;
    yOff: number;
    rotate?: number;
    size?: number;
    padding: number;
    width: number;
    height: number;
    sprite?: number[];
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    color: string;
    selectionIds: ISelectionId[];
    wordIndex: number;
    getWidthOfWord?: () => number;
    count: number;
    widthOfWord?: number;
}

export interface WordCloudData {
    dataView: DataView;
    settings: WordCloudSettings;
    texts: WordCloudText[];
    dataPoints: WordCloudDataPoint[];
}

export interface WordCloudDataView {
    data: WordCloudDataPoint[];
}
