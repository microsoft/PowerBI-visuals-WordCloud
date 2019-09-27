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

// powerbi.extensibility.utils.dataview
import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export class WordCloudSettings extends DataViewObjectsParser {
    public general: GeneralSettings = new GeneralSettings();
    public dataPoint: DataPointSettings = new DataPointSettings();
    public stopWords: StopWordsSettings = new StopWordsSettings();
    public rotateText: RotateTextSettings = new RotateTextSettings();
    public performance: PerformanceSettings = new PerformanceSettings();
}

export class GeneralSettings {
    public static FontSizePercentageFactor: number = 1;
    public static MinFontSize: number = 1;

    public minRepetitionsToDisplay: number = 1;
    public maxNumberOfWords: number = 200;
    public minFontSize: number = 20 / GeneralSettings.FontSizePercentageFactor;
    public maxFontSize: number = 100 / GeneralSettings.FontSizePercentageFactor;
    public isBrokenText: boolean = true;
    public isPunctuationsCharacters: boolean = false;
}

export class DataPointSettings {
    defaultColor: string = null;
}

export class StopWordsSettings {
    public show: boolean = true;
    public isDefaultStopWords: boolean = false;
    public words: string = null;
}

export class RotateTextSettings {
    public static MinAngle: number = -180;
    public static MaxAngle: number = 180;

    public static MinNumberOfWords: number = 1;
    public static MaxNumberOfWords: number = 2500;

    public show: boolean = true;
    public minAngle: number = -60;
    public maxAngle: number = 90;
    public maxNumberOfOrientations: number = 2;
}

export class PerformanceSettings {
    public preestimate: boolean = false;
    public quality: number = 40;
}
