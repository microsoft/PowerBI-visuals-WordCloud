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
    // d3
    import Selection = d3.Selection;
    import UpdateSelection = d3.selection.Update;
    import Transition = d3.Transition;



    // powerbi
    import IViewport = powerbi.IViewport;
    import DataView = powerbi.DataView;
    import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;
    import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
    import VisualObjectInstance = powerbi.VisualObjectInstance;
    import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;

    // powerbi.extensibility
    import IVisual = powerbi.extensibility.IVisual;
    import IColorPalette = powerbi.extensibility.IColorPalette;

    // powerbi.extensibility.visual
    import IVisualHost = powerbi.extensibility.visual.IVisualHost;
    import ISelectionIdBuilder = powerbi.extensibility.ISelectionIdBuilder;
    import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
    import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;

    // powerbi.visuals
    import ISelectionId = powerbi.visuals.ISelectionId;

    // powerbi.extensibility.utils.svg
    import IMargin = powerbi.extensibility.utils.svg.IMargin;
    import translate = powerbi.extensibility.utils.svg.translate;
    import IPoint = powerbi.extensibility.utils.svg.shapes.IPoint;
    import translateAndScale = powerbi.extensibility.utils.svg.translateAndScale;
    import ClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.ClassAndSelector;
    import createClassAndSelector = powerbi.extensibility.utils.svg.CssConstants.createClassAndSelector;

    // powerbi.extensibility.utils.type
    import PixelConverter = powerbi.extensibility.utils.type.PixelConverter;

    // powerbi.extensibility.utils.formatting
    import ValueFormatter = powerbi.extensibility.utils.formatting.valueFormatter;
    import IValueFormatter = powerbi.extensibility.utils.formatting.IValueFormatter;
    import textMeasurementService = powerbi.extensibility.utils.formatting.textMeasurementService;

    // powerbi.extensibility.utils.color
    import ColorHelper = powerbi.extensibility.utils.color.ColorHelper;

    enum WordCloudScaleType {
        logn,
        sqrt,
        value
    }

    export class WordCloud implements IVisual {
        private static ClassName: string = "wordCloud";

        private static Words: ClassAndSelector = createClassAndSelector("words");
        private static WordGroup: ClassAndSelector = createClassAndSelector("word");

        private static StopWordsDelimiter: string = " ";

        private static Radians: number = Math.PI / 180;

        private static MinOpacity: number = 0.2;
        private static MaxOpacity: number = 1;

        private static Punctuation: string[] = [
            "!", ".", ":", "'", ";", ",", "?",
            "@", "#", "$", "%", "^", "&", "*",
            "(", ")", "[", "]", "\"", "\\", "/",
            "-", "_", "+", "=", "<", ">", "|"
        ];

        private static StopWords: string[] = [
            "a", "able", "about", "across", "after", "all", "almost", "also", "am", "among", "an",
            "and", "any", "are", "as", "at", "be", "because", "been", "but", "by", "can", "cannot",
            "could", "did", "do", "does", "either", "else", "ever", "every", "for", "from", "get",
            "got", "had", "has", "have", "he", "her", "hers", "him", "his", "how", "however", "i",
            "if", "in", "into", "is", "it", "its", "just", "least", "let", "like", "likely", "may",
            "me", "might", "most", "must", "my", "neither", "no", "nor", "not", "of", "off", "often",
            "on", "only", "or", "other", "our", "own", "rather", "said", "say", "says", "she", "should",
            "since", "so", "some", "than", "that", "the", "their", "them", "then", "there", "these",
            "they", "this", "tis", "to", "too", "twas", "us", "wants", "was", "we", "were", "what",
            "when", "where", "which", "while", "who", "whom", "why", "will", "with", "would", "yet",
            "you", "your"
        ];

        private static DefaultMargin: IMargin = {
            top: 10,
            right: 10,
            bottom: 10,
            left: 10
        };

        private static MinViewport: IViewport = {
            width: 0,
            height: 0
        };

        private static DataPointFillProperty: DataViewObjectPropertyIdentifier = {
            objectName: "dataPoint",
            propertyName: "fill"
        };

        /**
         * Names of these consts aren't good, but I have no idea how to call them better.
         * TODO: Please rename them if you know any better names.
         */
        private static TheFirstLineHeight: string = PixelConverter.toString(5); // Note: This construction fixes bug #6343.
        private static TheSecondLineHeight: string = PixelConverter.toString(10); // Note: This construction fixes bug #6343.
        private static TheThirdLineHeight: string = PixelConverter.toString(14); // Note: This construction fixes bug #6343.
        private static TheFourthLineHeight: string = PixelConverter.toString(15); // Note: This construction fixes bug #6343.

        private static DefaultTextFontSize: string = PixelConverter.toString(1);
        private static MinFakeSize: number = 1;
        private static DefaultStrokeStyle: string = "red";
        private static DefaultTextAlign: string = "center";
        private static ArchimedeanFactor: number = 0.1;

        private static WidthOffset: number = 5;
        private static PositionOffset: number = 1;
        private static IndexOffset: number = 2;
        private static LxOffset: number = 4;

        private static ScalePositionOffset: number = 5;

        private static ByteMask: number = 31;
        private static TheFirstByteMask: number = 32;
        private static SxMask: number = 127;

        private static LineWidthFactor: number = 2;

        private static AdditionalDataPointSize: number = 1;
        private static AdditionalTextWidth: number = 2;
        private static AdditionalRandomValue: number = 0.5;

        private static MinCount: number = 1;

        private static DefaultDT: number = 1;
        private static DefaultX: number = 0;
        private static DefaultY: number = 0;
        private static DefaultPadding: number = 1;
        private static DefaultWidth: number = 0;
        private static DefaultHeight: number = 0;
        private static DefaultXOff: number = 0;
        private static DefaultYOff: number = 0;
        private static DefaultX0: number = 0;
        private static DefaultY0: number = 0;
        private static DefaultX1: number = 0;
        private static DefaultY1: number = 0;

        private static XOffsetPosition: number = 0.5;
        private static YOffsetPosition: number = 0.75;
        private static HeightOffsetPosition: number = 0.85;
        private static TextFillColor: string = "rgba(63, 191, 191, 0.0)";

        private static MinFontSize: number = 0;
        private static DefaultAngle: number = 0;

        private static ContextStartPosition: number = 0;

        private static DefaultMaxHeightOfTheWord: number = 0;

        private static FontSizePercentage: number = 100;

        private get settings(): WordCloudSettings {
            return this.data && this.data.settings;
        }

        private data: WordCloudData;
        private colorPalette: IColorPalette;
        private durationAnimations: number = 50;

        private specialViewport: IViewport;

        private fakeViewport: IViewport = {
            width: 1500,
            height: 1000
        };

        private canvasViewport: IViewport = {
            width: 128,
            height: 2048
        };

        private root: Selection<any>;
        private main: Selection<any>;
        private wordsContainerSelection: Selection<any>;
        private wordsGroupUpdateSelection: UpdateSelection<WordCloudDataPoint>;
        private wordsTextUpdateSelection: UpdateSelection<WordCloudDataPoint>;
        public canvasContext: CanvasRenderingContext2D;
        private fontFamily: string;
        private layout: VisualLayout;
        private visualHost: IVisualHost;
        private selectionManager: ValueSelectionManager<string>;
        private visualUpdateOptions: VisualUpdateOptions;
        private isUpdating: boolean = false;
        private incomingUpdateOptions: VisualUpdateOptions;
        private oldIdentityKeys: string[];
        public static converter(
            dataView: DataView,
            colors: IColorPalette,
            visualHost: IVisualHost,
            previousData: WordCloudData): WordCloudData {

            let categorical: WordCloudColumns<DataViewCategoryColumn>,
                catValues: WordCloudColumns<any[]>,
                settings: WordCloudSettings,
                colorHelper: ColorHelper,
                stopWords: string[],
                texts: WordCloudText[] = [],
                reducedTexts: WordCloudText[][],
                dataPoints: WordCloudDataPoint[],
                wordValueFormatter: IValueFormatter,
                queryName: string;

            categorical = WordCloudColumns.getCategoricalColumns(dataView);

            if (!categorical || !categorical.Category || _.isEmpty(categorical.Category.values)) {
                return null;
            }

            catValues = WordCloudColumns.getCategoricalValues(dataView);
            settings = WordCloud.parseSettings(dataView, previousData && previousData.settings);

            wordValueFormatter = ValueFormatter.create({
                format: ValueFormatter.getFormatStringByColumn(categorical.Category.source)
            });

            stopWords = !!settings.stopWords.words && _.isString(settings.stopWords.words)
                ? settings.stopWords.words.split(WordCloud.StopWordsDelimiter)
                : [];

            stopWords = settings.stopWords.isDefaultStopWords
                ? stopWords.concat(WordCloud.StopWords)
                : stopWords;

            colorHelper = new ColorHelper(
                colors,
                WordCloud.DataPointFillProperty,
                wordCloudUtils.getRandomColor());

            queryName = (categorical.Values
                && categorical.Values[0]
                && categorical.Values[0].source
                && categorical.Values[0].source.queryName)
                || null;
            for (let index: number = 0; index < catValues.Category.length; index += 1) {
                let item: any = catValues.Category[index];
                if (!item) {
                    continue;
                }
                let color: string;
                let selectionIdBuilder: ISelectionIdBuilder;
                if (categorical.Category.objects && categorical.Category.objects[index]) {
                    color = colorHelper.getColorForMeasure(categorical.Category.objects[index], "");
                } else {
                    color = previousData && previousData.texts && previousData.texts[index]
                        ? previousData.texts[index].color
                        : colors.getColor(index.toString()).value;
                }

                selectionIdBuilder = visualHost.createSelectionIdBuilder()
                    .withCategory(dataView.categorical.categories[0], index);

                if (queryName) {
                    selectionIdBuilder.withMeasure(queryName);
                }

                item = wordValueFormatter.format(item);
                texts.push({
                    text: item,
                    count: (catValues.Values
                        && catValues.Values[index]
                        && !isNaN(catValues.Values[index]))
                        ? catValues.Values[index]
                        : WordCloud.MinCount,
                    index: index,
                    selectionId: selectionIdBuilder.createSelectionId() as ISelectionId,
                    color: color,
                    textGroup: item
                });
            }

            reducedTexts = WordCloud.getReducedText(texts, stopWords, settings);
            dataPoints = WordCloud.getDataPoints(reducedTexts, settings);

            return {
                dataView: dataView,
                settings: settings,
                texts: texts,
                dataPoints: dataPoints
            };
        }

        private static parseSettings(dataView: DataView, previousSettings: WordCloudSettings): WordCloudSettings {
            const settings: WordCloudSettings = WordCloudSettings.parse<WordCloudSettings>(dataView);

            settings.general.minFontSize = Math.max(
                settings.general.minFontSize,
                GeneralSettings.MinFontSize);

            settings.general.maxFontSize = Math.max(
                settings.general.maxFontSize,
                GeneralSettings.MinFontSize);

            settings.general.maxFontSize = Math.max(
                settings.general.maxFontSize,
                settings.general.minFontSize);

            settings.rotateText.minAngle = Math.max(
                Math.min(settings.rotateText.minAngle, RotateTextSettings.MaxAngle),
                RotateTextSettings.MinAngle);

            settings.rotateText.maxAngle = Math.max(
                Math.min(settings.rotateText.maxAngle, RotateTextSettings.MaxAngle),
                RotateTextSettings.MinAngle);

            settings.rotateText.maxAngle = Math.max(
                settings.rotateText.maxAngle,
                settings.rotateText.minAngle);

            settings.general.maxNumberOfWords = Math.max(
                Math.min(settings.general.maxNumberOfWords, RotateTextSettings.MaxNumberOfWords),
                RotateTextSettings.MinNumberOfWords);

            settings.rotateText.maxNumberOfOrientations = Math.max(
                Math.min(settings.rotateText.maxNumberOfOrientations, RotateTextSettings.MaxNumberOfWords),
                RotateTextSettings.MinNumberOfWords);

            return settings;
        }

        private static getReducedText(
            texts: WordCloudText[],
            stopWords: string[],
            settings: WordCloudSettings): WordCloudText[][] {

            let brokenStrings: WordCloudText[] = WordCloud.processText(texts, stopWords, settings),
                result: WordCloudText[][] = <WordCloudText[][]>_.values(_.groupBy(
                    brokenStrings,
                    (textObject: WordCloudText) => textObject.text.toLocaleLowerCase()));

            result = result.map((texts: WordCloudText[]) => {
                return _.sortBy(texts, (textObject: WordCloudText) => textObject.textGroup.length);
            });

            return result;
        }

        private static processText(
            words: WordCloudText[],
            stopWords: string[],
            settings: WordCloudSettings): WordCloudText[] {
            let processedText: WordCloudText[] = [],
                partOfProcessedText: WordCloudText[] = [],
                whiteSpaceRegExp: RegExp = /\s/,
                punctuationRegExp: RegExp = new RegExp(`[${WordCloud.Punctuation.join("\\")}]`, "gim");

            words.forEach((item: WordCloudText) => {
                if (typeof item.text === "string") {
                    let splittedWords: string[] = item.text
                        .replace(punctuationRegExp, " ")
                        .split(whiteSpaceRegExp);
                    const splittedWordsOriginalLength: number = splittedWords.length;

                    splittedWords = WordCloud.getFilteredWords(splittedWords, stopWords, settings);
                    partOfProcessedText = settings.general.isBrokenText
                        ? WordCloud.getBrokenWords(splittedWords, item, whiteSpaceRegExp)
                        : WordCloud.getFilteredSentences(splittedWords, item, splittedWordsOriginalLength, settings, punctuationRegExp);

                    processedText.push(...partOfProcessedText);
                } else {
                    processedText.push(item);
                }
            });

            return processedText;
        }

        private static getBrokenWords(
            splittedWords: string[],
            item: WordCloudText,
            whiteSpaceRegExp: RegExp): WordCloudText[] {

            let brokenStrings: WordCloudText[] = [];

            splittedWords.forEach((splittedWord: string) => {
                if (splittedWord.length === 0 || whiteSpaceRegExp.test(splittedWord)) {
                    return;
                }

                brokenStrings.push({
                    text: splittedWord,
                    textGroup: item.textGroup,
                    count: item.count,
                    index: item.index,
                    selectionId: item.selectionId,
                    color: item.color
                });
            });

            return brokenStrings;
        }

        private static getFilteredSentences(
            splittedWords: string[],
            item: WordCloudText,
            splittedWordsOriginalLength: number,
            settings: WordCloudSettings,
            punctuationRegExp: RegExp): WordCloudText[] {

            if (!settings.general.isPunctuationsCharacters) {
                item.text = item.text
                   .replace(punctuationRegExp, " ");
            }

            if (splittedWords.length === splittedWordsOriginalLength) {
                return [item];
            }

            return [];
        }

        private static getFilteredWords(
            words: string[],
            stopWords: string[],
            settings: WordCloudSettings) {

            if (!settings.stopWords.show || !stopWords.length) {
                return words;
            }

            return words.filter((value: string) => {
                return value.length > 0 && !stopWords.some((removeWord: string) => {
                    return value.toLocaleLowerCase() === removeWord.toLocaleLowerCase();
                });
            });
        }

        private static getDataPoints(
            textGroups: WordCloudText[][],
            settings: WordCloudSettings): WordCloudDataPoint[] {

            if (_.isEmpty(textGroups)) {
                return [];
            }

            const returnValues: WordCloudDataPoint[] = textGroups.map((values: WordCloudText[]) => {
                return {
                    text: values[0].text,
                    x: WordCloud.DefaultX,
                    y: WordCloud.DefaultY,
                    rotate: WordCloud.getAngle(settings),
                    padding: WordCloud.DefaultPadding,
                    width: WordCloud.DefaultWidth,
                    height: WordCloud.DefaultHeight,
                    xOff: WordCloud.DefaultXOff,
                    yOff: WordCloud.DefaultYOff,
                    x0: WordCloud.DefaultX0,
                    y0: WordCloud.DefaultY0,
                    x1: WordCloud.DefaultX1,
                    y1: WordCloud.DefaultY1,
                    color: values[0].color,
                    selectionIds: values.map((text: WordCloudText) => text.selectionId),
                    wordIndex: values[0].index,
                    count: _.sumBy(values, (text: WordCloudText) => text.count)
                } as WordCloudDataPoint;
            });

            const minValue: number = _.minBy(returnValues, (dataPoint: WordCloudDataPoint) => dataPoint.count).count,
                maxValue: number = _.maxBy(returnValues, (dataPoint: WordCloudDataPoint) => dataPoint.count).count,
                texts: WordCloudText[] = textGroups.map((textGroup: WordCloudText[]) => textGroup[0]);

            returnValues.forEach((dataPoint: WordCloudDataPoint) => {
                dataPoint.size = WordCloud.getWordFontSize(
                    texts,
                    settings,
                    dataPoint.count,
                    minValue,
                    maxValue);
            });

            return returnValues.sort((firstDataPoint: WordCloudDataPoint, secondDataPoint: WordCloudDataPoint) => {
                return secondDataPoint.count - firstDataPoint.count;
            });
        }

        private static getWordFontSize(
            texts: WordCloudText[],
            settings: WordCloudSettings,
            value: number,
            minValue: number,
            maxValue: number,
            scaleType: WordCloudScaleType = WordCloudScaleType.value) {

            let weight: number,
                fontSize: number,
                minFontSize: number = settings.general.minFontSize * GeneralSettings.FontSizePercentageFactor,
                maxFontSize: number = settings.general.maxFontSize * GeneralSettings.FontSizePercentageFactor;

            if (texts.length <= RotateTextSettings.MinNumberOfWords) {
                return maxFontSize;
            }

            weight = WordCloud.getWeightByScaleType(value, scaleType);

            if (weight > minValue) {
                fontSize = (maxValue - minValue) !== WordCloud.MinFontSize
                    ? (maxFontSize * (weight - minValue)) / (maxValue - minValue)
                    : WordCloud.MinFontSize;
            } else {
                fontSize = WordCloud.MinFontSize;
            }

            fontSize = (fontSize * WordCloud.FontSizePercentage) / maxFontSize;

            fontSize = (fontSize * (maxFontSize - minFontSize)) / WordCloud.FontSizePercentage + minFontSize;

            return fontSize;
        }

        private static getWeightByScaleType(
            value: number,
            scaleType: WordCloudScaleType = WordCloudScaleType.value): number {

            switch (scaleType) {
                case WordCloudScaleType.logn: {
                    return Math.log(value);
                }
                case WordCloudScaleType.sqrt: {
                    return Math.sqrt(value);
                }
                case WordCloudScaleType.value:
                default: {
                    return value;
                }
            }
        }

        private static getAngle(settings: WordCloudSettings): number {
            if (!settings.rotateText.show) {
                return WordCloud.DefaultAngle;
            }

            const angle: number = ((settings.rotateText.maxAngle - settings.rotateText.minAngle)
                / settings.rotateText.maxNumberOfOrientations)
                * Math.floor(Math.random() * settings.rotateText.maxNumberOfOrientations);

            return settings.rotateText.minAngle + angle;
        }

        constructor(options: VisualConstructorOptions) {
            this.init(options);
        }

        public init(options: VisualConstructorOptions): void {
            this.root = d3.select(options.element).append("svg");

            this.colorPalette = options.host.colorPalette;
            this.visualHost = options.host;

            this.selectionManager = new ValueSelectionManager<string>(
                this.visualHost,
                (text: string): ISelectionId[] => {
                    const dataPoints: WordCloudDataPoint[] = this.data
                        && this.data.dataPoints
                        && this.data.dataPoints.filter((dataPoint: WordCloudDataPoint) => {
                            return dataPoint.text === text;
                        });

                    return dataPoints && dataPoints[0] && dataPoints[0].selectionIds
                        ? dataPoints[0].selectionIds
                        : [];
                });

            this.layout = new VisualLayout(null, WordCloud.DefaultMargin);

            this.root.classed(WordCloud.ClassName, true);

            this.root.on("click", () => {
                this.clearSelection();
            });

            this.fontFamily = this.root.style("font-family");

            this.main = this.root.append("g");

            this.wordsContainerSelection = this.main
                .append("g")
                .classed(WordCloud.Words.className, true);

            // init canvas context for calculate label positions
            const canvas = document.createElement("canvas");
            this.canvasContext = this.getCanvasContext(canvas);
        }

        public update(visualUpdateOptions: VisualUpdateOptions): void {
            if (!visualUpdateOptions
                || !visualUpdateOptions.viewport
                || !visualUpdateOptions.dataViews
                || !visualUpdateOptions.dataViews[0]
                || !visualUpdateOptions.viewport
                || !(visualUpdateOptions.viewport.height >= WordCloud.MinViewport.height)
                || !(visualUpdateOptions.viewport.width >= WordCloud.MinViewport.width)) {

                return;
            }

            if (visualUpdateOptions !== this.visualUpdateOptions) {
                this.incomingUpdateOptions = visualUpdateOptions;
            }

            if (!this.isUpdating && (this.incomingUpdateOptions !== this.visualUpdateOptions)) {
                this.visualUpdateOptions = this.incomingUpdateOptions;
                this.layout.viewport = this.visualUpdateOptions.viewport;

                const dataView: DataView = visualUpdateOptions.dataViews[0];

                if (this.layout.viewportInIsZero) {
                    return;
                }

                this.updateSize();

                const data: WordCloudData = WordCloud.converter(
                    dataView,
                    this.colorPalette,
                    this.visualHost,
                    this.data);

                if (!data) {
                    this.clear();
                    return;
                }

                this.data = data;

                this.computePositions((wordCloudDataView: WordCloudDataView) => {
                    this.render(wordCloudDataView);
                });
            }
        }

        private clear(): void {
            this.main
                .select(WordCloud.Words.selectorName)
                .selectAll(WordCloud.WordGroup.selectorName)
                .remove();
        }

        private computePositions(onPositionsComputed: (WordCloudDataView) => void): void {
            const words: WordCloudDataPoint[] = this.data.dataPoints;

            if (_.isEmpty(words)) {
                this.clear();

                return;
            }

            requestAnimationFrame(() => {
                let surface: number[] = _.range(
                    WordCloud.MinViewport.width,
                    (this.specialViewport.width >> WordCloud.WidthOffset) * this.specialViewport.height,
                    WordCloud.MinViewport.width);

                words.forEach((dataPoint: WordCloudDataPoint) => {
                    dataPoint.getWidthOfWord = () =>
                        dataPoint.widthOfWord
                        ||
                        (dataPoint.widthOfWord = textMeasurementService.measureSvgTextWidth({
                            fontFamily: this.fontFamily,
                            fontSize: PixelConverter.toString(dataPoint.size + WordCloud.AdditionalDataPointSize),
                            text: dataPoint.text
                        }) + WordCloud.AdditionalTextWidth);
                });

                if (this.canvasContext) {
                    this.computeCycle(
                        words,
                        this.canvasContext,
                        surface,
                        null,
                        onPositionsComputed);
                }
            });
        }

        private computeCycle(
            words: WordCloudDataPoint[],
            context: CanvasRenderingContext2D,
            surface: number[],
            borders: IPoint[],
            onPositionsComputed: (WordCloudDataView) => void,
            wordsForDraw: WordCloudDataPoint[] = [],
            index: number = 0): void {

            let word: WordCloudDataPoint = words[index],
                ratio: number = this.getRatio(words.length);

            word.x = (this.specialViewport.width / ratio
                * (Math.random() + WordCloud.AdditionalRandomValue)) >> WordCloud.PositionOffset;

            word.y = (this.specialViewport.height / ratio
                * (Math.random() + WordCloud.AdditionalRandomValue)) >> WordCloud.PositionOffset;

            if (!word.sprite) {
                this.generateSprites(context, words, index);
            }

            if (word.sprite && this.findPosition(surface, word, borders)) {
                wordsForDraw.push(word);

                borders = this.updateBorders(word, borders);
                word.x -= this.specialViewport.width >> WordCloud.PositionOffset;
                word.y -= this.specialViewport.height >> WordCloud.PositionOffset;

                if (wordsForDraw.length >= this.settings.general.maxNumberOfWords) {
                    index = words.length - 1;
                }
            }

            if (++index < words.length && this.root) {
                this.computeCycle(
                    words,
                    context,
                    surface,
                    borders,
                    onPositionsComputed,
                    wordsForDraw,
                    index);
            } else {
                onPositionsComputed({
                    data: wordsForDraw,
                    leftBorder: borders && borders[0],
                    rightBorder: borders && borders[1]
                });
            }
        }

        private getRatio(length: number): number {
            let ratio: number = 1;

            if (length <= 10) {
                ratio = 5;
            }
            else if (length <= 25) {
                ratio = 3;
            }
            else if (length <= 75) {
                ratio = 1.5;
            }
            else if (length <= 100) {
                ratio = 1.25;
            }

            return ratio;
        }

        private updateBorders(word: WordCloudDataPoint, borders: IPoint[]): IPoint[] {
            if (borders && borders.length === 2) {
                let leftBorder: IPoint = borders[0],
                    rightBorder: IPoint = borders[1];

                if (word.x + word.x0 < leftBorder.x) {
                    leftBorder.x = word.x + word.x0;
                }

                if (word.y + word.y0 < leftBorder.y) {
                    leftBorder.y = word.y + word.y0;
                }

                if (word.x + word.x1 > rightBorder.x) {
                    rightBorder.x = word.x + word.x1;
                }

                if (word.y + word.y1 > rightBorder.y) {
                    rightBorder.y = word.y + word.y1;
                }
            } else {
                borders = [
                    {
                        x: word.x + word.x0,
                        y: word.y + word.y0
                    }, {
                        x: word.x + word.x1,
                        y: word.y + word.y1
                    }
                ];
            }

            return borders;
        }

        private generateSprites(
            context: CanvasRenderingContext2D,
            words: WordCloudDataPoint[],
            startIndex: number): void {

            context.clearRect(
                WordCloud.ContextStartPosition,
                WordCloud.ContextStartPosition,
                this.canvasViewport.width << WordCloud.WidthOffset,
                this.canvasViewport.height);

            let x: number = WordCloud.DefaultX,
                y: number = WordCloud.DefaultX,
                maxHeight: number = WordCloud.DefaultMaxHeightOfTheWord;

            for (let i: number = startIndex, length: number = words.length; i < length; i++) {
                let currentWordData: WordCloudDataPoint = words[i],
                    widthOfWord: number = currentWordData.getWidthOfWord(),
                    heightOfWord: number = currentWordData.size << WordCloud.PositionOffset;

                if (currentWordData.rotate) {
                    const sr: number = Math.sin(currentWordData.rotate * WordCloud.Radians),
                        cr: number = Math.cos(currentWordData.rotate * WordCloud.Radians),
                        widthCr: number = widthOfWord * cr,
                        widthSr: number = widthOfWord * sr,
                        heightCr: number = heightOfWord * cr,
                        heightSr: number = heightOfWord * sr;

                    widthOfWord = (Math.max(
                        Math.abs(widthCr + heightSr),
                        Math.abs(widthCr - heightSr)) + WordCloud.ByteMask) >> WordCloud.WidthOffset << WordCloud.WidthOffset;

                    heightOfWord = Math.floor(Math.max(
                        Math.abs(widthSr + heightCr),
                        Math.abs(widthSr - heightCr)));
                } else {
                    widthOfWord = (widthOfWord + WordCloud.ByteMask) >> WordCloud.WidthOffset << WordCloud.WidthOffset;
                }

                if (heightOfWord > maxHeight) {
                    maxHeight = heightOfWord;
                }

                if (x + widthOfWord >= (this.canvasViewport.width << WordCloud.WidthOffset)) {
                    x = 0;
                    y += maxHeight;
                    maxHeight = 0;
                }

                context.save();

                context.font = `normal normal ${currentWordData.size + WordCloud.AdditionalDataPointSize}px ${this.fontFamily}`;

                context.translate(
                    (x + (widthOfWord >> WordCloud.PositionOffset)),
                    (y + (heightOfWord >> WordCloud.PositionOffset)));

                if (currentWordData.rotate) {
                    context.rotate(currentWordData.rotate * WordCloud.Radians);
                }

                context.fillText(currentWordData.text, 0, 0);

                if (currentWordData.padding) {
                    context.lineWidth = WordCloud.LineWidthFactor * currentWordData.padding;
                    context.strokeText(currentWordData.text, 0, 0);
                }

                context.restore();

                currentWordData.width = widthOfWord;
                currentWordData.height = heightOfWord;

                currentWordData.xOff = x;
                currentWordData.yOff = y;

                currentWordData.x1 = widthOfWord >> WordCloud.PositionOffset;
                currentWordData.y1 = heightOfWord >> WordCloud.PositionOffset;

                currentWordData.x0 = -currentWordData.x1;
                currentWordData.y0 = -currentWordData.y1;

                x += widthOfWord;
            }

            this.setSprites(context, words);
        }

        private setSprites(context: CanvasRenderingContext2D, words: WordCloudDataPoint[]): void {
            let pixels: Uint8ClampedArray,
                sprites: number[] = [];

            pixels = context.getImageData(
                WordCloud.ContextStartPosition,
                WordCloud.ContextStartPosition,
                this.canvasViewport.width << WordCloud.WidthOffset,
                this.canvasViewport.height).data;

            for (let i: number = words.length - 1; i >= 0; i--) {
                let currentWordData: WordCloudDataPoint = words[i],
                    width: number = currentWordData.width,
                    width32: number = width >> 5,
                    height: number = currentWordData.y1 - currentWordData.y0,
                    x: number = 0,
                    y: number = 0,
                    seen: number = 0,
                    seenRow: number = 0;

                if (currentWordData.xOff + width >= (this.canvasViewport.width << WordCloud.WidthOffset)
                    || currentWordData.yOff + height >= this.canvasViewport.height) {
                    currentWordData.sprite = null;

                    continue;
                }

                for (let j: number = 0; j < height * width32; j++) {
                    sprites[j] = 0;
                }

                if (currentWordData.xOff !== null) {
                    x = currentWordData.xOff;
                } else {
                    return;
                }

                y = currentWordData.yOff;

                seen = 0;
                seenRow = -1;

                for (let j: number = 0; j < height; j++) {
                    for (let k: number = 0; k < width; k++) {
                        const l: number = width32 * j + (k >> WordCloud.WidthOffset),
                            index: number = ((y + j)
                                * (this.canvasViewport.width << WordCloud.WidthOffset)
                                + (x + k)) << WordCloud.IndexOffset,
                            m: number = pixels[index]
                                ? 1 << (WordCloud.ByteMask - (k % WordCloud.TheFirstByteMask))
                                : 0;

                        sprites[l] |= m;
                        seen |= m;
                    }

                    if (seen) {
                        seenRow = j;
                    } else {
                        currentWordData.y0++;
                        height--;
                        j--;
                        y++;
                    }
                }

                currentWordData.y1 = currentWordData.y0 + seenRow;
                currentWordData.sprite = sprites.slice(0, (currentWordData.y1 - currentWordData.y0) * width32);
            }
        }

        private findPosition(surface: number[], word: WordCloudDataPoint, borders: IPoint[]): boolean {
            let startPoint: IPoint = { x: word.x, y: word.y },
                delta: number = Math.sqrt(this.specialViewport.width * this.specialViewport.width
                    + this.specialViewport.height * this.specialViewport.height),
                point: IPoint,
                dt: number = Math.random() < WordCloud.AdditionalRandomValue
                    ? WordCloud.DefaultDT
                    : -WordCloud.DefaultDT,
                shift: number = -dt,
                dx: number,
                dy: number;

            while (true) {
                shift += dt;

                point = this.archimedeanSpiral(shift);

                dx = Math.floor(point.x);
                dy = Math.floor(point.y);

                if (Math.min(Math.abs(dx), Math.abs(dy)) >= delta) {
                    break;
                }

                word.x = startPoint.x + dx;
                word.y = startPoint.y + dy;

                if (word.x + word.x0 < WordCloud.DefaultX0
                    || word.y + word.y0 < WordCloud.DefaultY0
                    || word.x + word.x1 > this.specialViewport.width
                    || word.y + word.y1 > this.specialViewport.height) {

                    continue;
                }

                if (!borders || !this.checkIntersect(word, surface)) {
                    if (!borders || this.checkIntersectOfRectangles(word, borders[0], borders[1])) {
                        let sprite: number[] = word.sprite,
                            width: number = word.width >> WordCloud.WidthOffset,
                            shiftWidth: number = this.specialViewport.width >> WordCloud.WidthOffset,
                            lx: number = word.x - (width << WordCloud.LxOffset),
                            sx: number = lx & WordCloud.SxMask,
                            msx: number = WordCloud.TheFirstByteMask - sx,
                            height: number = word.y1 - word.y0,
                            x: number = (word.y + word.y0) * shiftWidth + (lx >> WordCloud.WidthOffset);

                        for (let i: number = 0; i < height; i++) {
                            let lastSprite: number = 0;

                            for (let j: number = 0; j <= width; j++) {
                                let leftMask: number = lastSprite << msx,
                                    rightMask: number;

                                if (j < width)
                                    lastSprite = sprite[i * width + j];

                                rightMask = j < width
                                    ? lastSprite >>> sx
                                    : 0;

                                surface[x + j] |= leftMask | rightMask;
                            }

                            x += shiftWidth;
                        }

                        word.sprite = null;

                        return true;
                    }
                }
            }

            return false;
        }

        private archimedeanSpiral(value: number): IPoint {
            const ratio: number = this.specialViewport.width / this.specialViewport.height;

            value = value * WordCloud.ArchimedeanFactor;

            return {
                x: ratio * value * Math.cos(value),
                y: value * Math.sin(value)
            };
        }

        private checkIntersect(word: WordCloudDataPoint, surface: number[]): boolean {
            let shiftWidth: number = this.specialViewport.width >> WordCloud.WidthOffset,
                sprite: number[] = word.sprite,
                widthOfWord: number = word.width >> WordCloud.WidthOffset,
                lx: number = word.x - (widthOfWord << WordCloud.LxOffset),
                sx: number = lx & WordCloud.SxMask,
                msx: number = WordCloud.TheFirstByteMask - sx,
                heightOfWord: number = word.y1 - word.y0,
                x: number = (word.y + word.y0) * shiftWidth + (lx >> WordCloud.WidthOffset);

            for (let i: number = 0; i < heightOfWord; i++) {
                let lastSprite: number = 0;

                for (let j: number = 0; j <= widthOfWord; j++) {
                    let mask: number = 0,
                        leftMask: number,
                        intersectMask: number = 0;

                    leftMask = lastSprite << msx;

                    if (j < widthOfWord) {
                        lastSprite = sprite[i * widthOfWord + j];
                    }

                    mask = j < widthOfWord
                        ? lastSprite >>> sx
                        : 0;

                    intersectMask = (leftMask | mask) & surface[x + j];

                    if (intersectMask) {
                        return true;
                    }
                }

                x += shiftWidth;
            }

            return false;
        }

        private checkIntersectOfRectangles(
            word: WordCloudDataPoint,
            leftBorder: IPoint,
            rightBorder: IPoint): boolean {

            return (word.x + word.x1) > leftBorder.x
                && (word.x + word.x0) < rightBorder.x
                && (word.y + word.y1) > leftBorder.y
                && (word.y + word.y0) < rightBorder.y;
        }

        /**
         * Returns a CanvasRenderingContext2D to compute size of the text.
         *
         * Public for testability.
         */
        public getCanvasContext(canvasElement: HTMLCanvasElement): CanvasRenderingContext2D {
            if (!canvasElement) {
                return null;
            }

            canvasElement.width = this.canvasViewport.width << WordCloud.WidthOffset;
            canvasElement.height = this.canvasViewport.height;

            const context = canvasElement.getContext("2d");

            context.fillStyle = context.strokeStyle = WordCloud.DefaultStrokeStyle;
            context.textAlign = WordCloud.DefaultTextAlign;

            return context;
        }

        private updateSize(): void {
            let fakeWidth: number,
                fakeHeight: number,
                ratio: number;

            ratio = Math.sqrt((this.fakeViewport.width * this.fakeViewport.height)
                / (this.layout.viewportIn.width * this.layout.viewportIn.height));

            if (isNaN(ratio)) {
                fakeHeight = fakeWidth = WordCloud.MinFakeSize;
            } else {
                fakeHeight = this.layout.viewportIn.height * ratio;
                fakeWidth = this.layout.viewportIn.width * ratio;
            }

            this.specialViewport = {
                height: fakeHeight,
                width: fakeWidth
            };

            this.root.attr({
                "height": this.layout.viewport.height,
                "width": this.layout.viewport.width
            });
        }

        private render(wordCloudDataView: WordCloudDataView): void {
            if (!wordCloudDataView || !wordCloudDataView.data) {
                return;
            }

            this.scaleMainView(wordCloudDataView);

            this.wordsGroupUpdateSelection = this.main
                .select(WordCloud.Words.selectorName)
                .selectAll("g")
                .data(wordCloudDataView.data);

            let wordGroupEnterSelection: Selection<WordCloudDataPoint> = this.wordsGroupUpdateSelection
                .enter()
                .append("svg:g")
                .classed(WordCloud.WordGroup.className, true);

            wordGroupEnterSelection
                .append("svg:text")
                .style("font-size", WordCloud.DefaultTextFontSize);

            wordGroupEnterSelection
                .append("svg:rect");

            this.wordsGroupUpdateSelection
                .exit()
                .remove();

            this.wordsGroupUpdateSelection
                .attr("transform", (dataPoint: WordCloudDataPoint) => {
                    return `${translate(dataPoint.x, dataPoint.y)} rotate(${dataPoint.rotate})`;
                })
                .sort((a: WordCloudDataPoint, b: WordCloudDataPoint) => {
                    return b.height * b.width - a.height * a.width;
                });

            this.wordsTextUpdateSelection = this.wordsGroupUpdateSelection
                .selectAll("text")
                .data((dataPoint: WordCloudDataPoint) => [dataPoint]);

            this.wordsTextUpdateSelection.text((dataPoint: WordCloudDataPoint) => dataPoint.text);

            this.animateSelection(this.wordsTextUpdateSelection, this.durationAnimations)
                .style({
                    "font-size": ((item: WordCloudDataPoint): string => PixelConverter.toString(item.size)),
                    "fill": ((item: WordCloudDataPoint): string => item.color),
                });

            this.wordsGroupUpdateSelection
                .selectAll("rect")
                .data((dataPoint: WordCloudDataPoint) => [dataPoint])
                .attr({
                    x: (dataPoint: WordCloudDataPoint) => -dataPoint.getWidthOfWord() * WordCloud.XOffsetPosition,
                    width: (dataPoint: WordCloudDataPoint) => dataPoint.getWidthOfWord(),
                    y: (dataPoint: WordCloudDataPoint) => -dataPoint.size * WordCloud.YOffsetPosition,
                    height: (dataPoint: WordCloudDataPoint) => dataPoint.size * WordCloud.HeightOffsetPosition,
                    fill: () => WordCloud.TextFillColor,
                })
                .on("click", (dataPoint: WordCloudDataPoint) => {
                    (d3.event as MouseEvent).stopPropagation();

                    this.setSelection(dataPoint);
                });

            this.clearIncorrectSelection(this.data.dataView);
            this.renderSelection();

            this.isUpdating = false;

            if (this.incomingUpdateOptions !== this.visualUpdateOptions) {
                this.update(this.incomingUpdateOptions);
            }
        }

        private clearIncorrectSelection(dataView: DataView): void {
            let categories: DataViewCategoryColumn[],
                identityKeys: string[],
                oldIdentityKeys: string[] = this.oldIdentityKeys;

            categories = dataView
                && dataView.categorical
                && dataView.categorical.categories;

            identityKeys = categories
                && categories[0]
                && categories[0].identity
                && categories[0].identity.map((identity: DataViewScopeIdentity) => identity.key);

            this.oldIdentityKeys = identityKeys;

            if (oldIdentityKeys && oldIdentityKeys.length > identityKeys.length) {
                this.selectionManager.clear(false);

                return;
            }

            if (!_.isEmpty(identityKeys)) {
                let incorrectValues: SelectionIdValues<string>[] = this.selectionManager
                    .getSelectionIdValues
                    .filter((idValue: SelectionIdValues<string>) => {
                        return idValue.selectionId.some((selectionId: ISelectionId) => {
                            return _.includes(identityKeys, selectionId.getKey());
                        });
                    });

                incorrectValues.forEach((value: SelectionIdValues<string>) => {
                    this.selectionManager
                        .selectedValues
                        .splice(this.selectionManager
                            .selectedValues
                            .indexOf(value.value), 1);
                });
            }
        }

        private setSelection(dataPoint: WordCloudDataPoint): void {
            if (!dataPoint) {
                this.clearSelection();

                return;
            }

            this.selectionManager
                .selectAndSendSelection(dataPoint.text, (d3.event as MouseEvent).ctrlKey)
                .then(() => this.renderSelection());
        }

        private clearSelection(): void {
            this.selectionManager
                .clear(true)
                .then(() => this.renderSelection());
        }

        private scaleMainView(wordCloudDataView: WordCloudDataView): void {
            const rectangles: ClientRect[] = wordCloudDataView.data.map((dataPoint: WordCloudDataPoint) => {
                const hw: number = dataPoint.width / 2,
                    hh: number = dataPoint.height / 2;

                return {
                    left: dataPoint.x - hw,
                    top: dataPoint.y - hh,
                    right: dataPoint.x + hw,
                    bottom: dataPoint.y + hh
                } as ClientRect;
            });

            if (_.isEmpty(rectangles)) {
                return;
            }

            const rectangle: ClientRect = {
                left: _.minBy(rectangles, (rect: ClientRect) => rect.left).left,
                top: _.minBy(rectangles, (rect: ClientRect) => rect.top).top,
                right: _.maxBy(rectangles, (rect: ClientRect) => rect.right).right,
                bottom: _.maxBy(rectangles, (rect: ClientRect) => rect.bottom).bottom
            } as ClientRect;

            const rectWidth: number = rectangle.right - rectangle.left,
                rectHeight: number = rectangle.bottom - rectangle.top;

            const scaleByX: number = this.layout.viewportIn.width / rectWidth,
                scaleByY: number = this.layout.viewportIn.height / rectHeight,
                scale: number = Math.min(scaleByX, scaleByY);

            const x: number = -rectangle.left * scale + WordCloud.ScalePositionOffset,
                y: number = -rectangle.top * scale + WordCloud.ScalePositionOffset;

            /**
             * Note: This construction fixes bug #6343.
             * Edge renders words out of the canvas, so we use this hack to fix it.
             * The line-height doesn't work with svg, but it call the render cycle of the browser.
             */
            this.main
                .style("line-height", WordCloud.TheFirstLineHeight); // Note: This construction fixes bug #6343.

            this.main
                .attr("transform", translateAndScale(x, y, scale))
                .style("line-height", WordCloud.TheSecondLineHeight); // Note: This construction fixes bug #6343.
        }

        private renderSelection(): void {
            if (!this.wordsTextUpdateSelection) {
                return;
            }

            if (!this.selectionManager.hasSelection) {
                this.setOpacity(this.wordsTextUpdateSelection, WordCloud.MaxOpacity);

                return;
            }

            const selectedColumns: UpdateSelection<WordCloudDataPoint> = this.wordsTextUpdateSelection
                .filter((dataPoint: WordCloudDataPoint) => {
                    return this.selectionManager.isSelected(dataPoint.text);
                });

            this.setOpacity(this.wordsTextUpdateSelection, WordCloud.MinOpacity);
            this.setOpacity(selectedColumns, WordCloud.MaxOpacity);
        }

        private setOpacity(element: Selection<any>, opacityValue: number): void {
            element.style("fill-opacity", opacityValue);

            if (this.main) { // Note: This construction fixes bug #6343.
                this.main.style("line-height", WordCloud.TheThirdLineHeight);

                this.animateSelection(this.main, 0, this.durationAnimations)
                    .style("line-height", WordCloud.TheFourthLineHeight);
            }
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            const settings: WordCloudSettings = this.settings
                ? this.settings
                : WordCloudSettings.getDefault() as WordCloudSettings;

            let instanceEnumeration: VisualObjectInstanceEnumeration =
                WordCloudSettings.enumerateObjectInstances(settings, options);

            switch (options.objectName) {
                case "dataPoint": {
                    if (this.data && this.data.dataPoints) {
                        this.enumerateDataPoint(options, instanceEnumeration);
                    }

                    break;
                }
            }

            return instanceEnumeration || [];
        }

        private enumerateDataPoint(
            options: EnumerateVisualObjectInstancesOptions,
            instanceEnumeration: VisualObjectInstanceEnumeration): void {

            let uniqueDataPoints: WordCloudDataPoint[] = _.uniqBy(
                this.data.dataPoints,
                (dataPoint: WordCloudDataPoint) => dataPoint.wordIndex);

            this.enumerateDataPointColor(uniqueDataPoints, options, instanceEnumeration);
        }

        private enumerateDataPointColor(
            dataPoints: WordCloudDataPoint[],
            options: EnumerateVisualObjectInstancesOptions,
            instanceEnumeration: VisualObjectInstanceEnumeration): void {

            let wordCategoriesIndex: number[] = [];

            dataPoints.forEach((item: WordCloudDataPoint) => {
                if (wordCategoriesIndex.indexOf(item.wordIndex) === -1) {
                    let instance: VisualObjectInstance;

                    wordCategoriesIndex.push(item.wordIndex);

                    instance = {
                        objectName: options.objectName,
                        displayName: this.data.texts[item.wordIndex].text,
                        selector: ColorHelper.normalizeSelector(
                            item.selectionIds[0].getSelector(),
                            false),
                        properties: { fill: { solid: { color: item.color } } }
                    };

                    this.addAnInstanceToEnumeration(instanceEnumeration, instance);
                }
            });

        }

        private addAnInstanceToEnumeration(
            instanceEnumeration: VisualObjectInstanceEnumeration,
            instance: VisualObjectInstance): void {

            if ((instanceEnumeration as VisualObjectInstanceEnumerationObject).instances) {
                (instanceEnumeration as VisualObjectInstanceEnumerationObject)
                    .instances
                    .push(instance);
            } else {
                (instanceEnumeration as VisualObjectInstance[]).push(instance);
            }
        }

        private animateSelection<T extends Selection<any>>(
            element: T,
            duration: number = 0,
            delay: number = 0,
            callback?: (data: any, index: number) => void): Transition<any> {

            return element
                .transition()
                .delay(delay)
                .duration(duration)
                .each("end", callback);
        }

        public destroy(): void {
            this.root = null;
        }
    }
}
