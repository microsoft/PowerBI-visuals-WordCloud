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

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.Card;
import FormattingSettingsModel = formattingSettings.Model;
import FormattingSettingsSlice = formattingSettings.Slice;
import { WordCloudDataPoint } from "./dataInterfaces";
import { ColorHelper } from "powerbi-visuals-utils-colorutils";
import uniqBy from "lodash.uniqby";

export class WordCloudSettings extends FormattingSettingsModel {
    public general: GeneralSettings = new GeneralSettings();
    public dataPoint: DataPointSettings = new DataPointSettings();
    public stopWords: StopWordsSettings = new StopWordsSettings();
    public rotateText: RotateTextSettings = new RotateTextSettings();
    public performance: PerformanceSettings = new PerformanceSettings();

    public cards: FormattingSettingsCard[] = [this.general, this.dataPoint, this.stopWords, this.rotateText, this.performance];

    public initColors(dataPoints: WordCloudDataPoint[]) {
        const wordCategoriesIndex: number[] = [];

        const uniqueDataPoints: WordCloudDataPoint[] = uniqBy(dataPoints, (dataPoint: WordCloudDataPoint) => dataPoint.wordIndex);
        this.dataPoint.slices = [this.dataPoint.slices[0], this.dataPoint.slices[1]];

        uniqueDataPoints.forEach((dataPoint: WordCloudDataPoint) => {
            if (wordCategoriesIndex.indexOf(dataPoint.wordIndex) === -1) {
                wordCategoriesIndex.push(dataPoint.wordIndex);
                this.dataPoint.slices.push(new formattingSettings.ColorPicker({
                    name: "fill",
                    displayName: dataPoint.text,
                    selector: ColorHelper.normalizeSelector(
                        dataPoint.selectionIds[0].getSelector(),
                        false),
                    
                    value: { value: dataPoint.color }
                }));
            }
        });
    }
}

 export class GeneralSettings extends FormattingSettingsCard {
    public static FontSizePercentageFactor: number = 1;
    public static MinFontSize: number = 1;

    public name = "general";
    public displayNameKey = "Visual_General";

    public minRepetitionsToDisplay = new formattingSettings.NumUpDown({
        name: "minRepetitionsToDisplay",
        displayNameKey: "Visual_WordCloud_minRepetitionsToDisplay",
        value: 1,
    });

    public maxNumberOfWords = new formattingSettings.NumUpDown({
        name: "maxNumberOfWords",
        displayNameKey: "Visual_WordCloud_MaxNumberWords",
        value: 200,
    });

    public minFontSize = new formattingSettings.NumUpDown({
        name: "minFontSize",
        displayNameKey: "Visual_MinFontSize",
        value: 20 / GeneralSettings.FontSizePercentageFactor,
        options: {
            minValue: {
                type: powerbi.visuals.ValidatorType.Min,
                value: 1,
            },
            maxValue: {
                type: powerbi.visuals.ValidatorType.Max,
                value: 100,
            },
        },
    });

    public maxFontSize = new formattingSettings.NumUpDown({
        name: "maxFontSize",
        displayNameKey: "Visual_MaxFontSize",
        value: 100 / GeneralSettings.FontSizePercentageFactor,
        options: {
            minValue: {
                type: powerbi.visuals.ValidatorType.Min,
                value: 1,
            },
            maxValue: {
                type: powerbi.visuals.ValidatorType.Max,
                value: 100,
            },
        },
    });

    public isBrokenText = new formattingSettings.ToggleSwitch({
        name: "isBrokenText",
        displayNameKey: "Visual_WordCloud_WordBreaking",
        value: true,
    });

    public isPunctuationsCharacters = new formattingSettings.ToggleSwitch({
        name: "isPunctuationsCharacters",
        displayNameKey: "Visual_WordCloud_SpecialCharacters",
        value: false,
    });
    
    public slices: FormattingSettingsSlice[] = [this.minRepetitionsToDisplay, this.maxNumberOfWords, this.minFontSize, this.maxFontSize, this.isBrokenText, this.isPunctuationsCharacters]; 
}

export class DataPointSettings extends FormattingSettingsCard {
    public name = "dataPoint";
    public displayNameKey = "Visual_DataColors";

    public defaultColor = new formattingSettings.ColorPicker({
        name: "defaultColor",
        displayNameKey: "Visual_DefaultColor",
        value: {
            value: null
        },
    });

    public isShowAll = new formattingSettings.ToggleSwitch({
        name: "isShowAll",
        displayNameKey: "Visual_ShowAll",
        value: false,
    });

    public slices: FormattingSettingsSlice[] = [this.defaultColor, this.isShowAll];
}

export class StopWordsSettings extends FormattingSettingsCard {
    public name = "stopWords";
    public displayNameKey = "Visual_WordCloud_StopWords";

    public show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_Show",
        value: true,
        topLevelToggle: true,
    });

    public isDefaultStopWords = new formattingSettings.ToggleSwitch({
        name: "isDefaultStopWords",
        displayNameKey: "Visual_WordCloud_DefaultStopWords",
        value: false,
    });

    public words = new formattingSettings.TextInput({
        name: "words",
        displayNameKey: "Visual_WordCloud_Words",
        value: "",
        placeholder: "",
    });

    public slices: FormattingSettingsSlice[] = [this.show, this.isDefaultStopWords, this.words];
}

export class RotateTextSettings extends FormattingSettingsCard {
    public static MinAngle: number = -180;
    public static MaxAngle: number = 180;

    public static MinNumberOfWords: number = 1;
    public static MaxNumberOfWords: number = 2500;

    public name = "rotateText";
    public displayNameKey = "Visual_RotateText";

    public show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayNameKey: "Visual_Show",
        value: true,
        topLevelToggle: true,
    });

    public minAngle = new formattingSettings.NumUpDown({
        name: "minAngle",
        displayNameKey: "Visual_MinAngle",
        value: -60,
        options: {
            minValue: {
                type: powerbi.visuals.ValidatorType.Min,
                value: RotateTextSettings.MinAngle,
            },
            maxValue: {
                type: powerbi.visuals.ValidatorType.Max,
                value: RotateTextSettings.MaxAngle,
            },
        },
    });

    public maxAngle = new formattingSettings.NumUpDown({
        name: "maxAngle",
        displayNameKey: "Visual_MaxAngle",
        value: 90,
        options: {
            minValue: {
                type: powerbi.visuals.ValidatorType.Min,
                value: RotateTextSettings.MinAngle,
            },
            maxValue: {
                type: powerbi.visuals.ValidatorType.Max,
                value: RotateTextSettings.MaxAngle,
            },
        },
    });

    public maxNumberOfOrientations = new formattingSettings.NumUpDown({
        name: "maxNumberOfOrientations",
        displayNameKey: "Visual_WordCloud_MaxOrientationNumber",
        value: 2,
    });

    public slices: FormattingSettingsSlice[] = [this.show, this.minAngle, this.maxAngle, this.maxNumberOfOrientations];
}

export class PerformanceSettings extends FormattingSettingsCard {
    public name = "performance";
    public displayNameKey = "Visual_Performance";

    public preestimate = new formattingSettings.ToggleSwitch({
        name: "preestimate",
        displayNameKey: "Visual_PreestimateWordCount",
        value: false,
    });

    public quality = new formattingSettings.NumUpDown({
        name: "quality",
        displayNameKey: "Visual_Quality",
        value: 40,
        options: {
            minValue: {
                type: powerbi.visuals.ValidatorType.Min,
                value: 1,
            },
            maxValue: {
                type: powerbi.visuals.ValidatorType.Max,
                value: 100,
            },
            unitSymbolAfterInput: true,
            unitSymbol: "%"
        },
    });

    public slices: FormattingSettingsSlice[] = [this.preestimate, this.quality];
}
