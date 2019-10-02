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
import * as d3 from "d3";
import * as lodash from "lodash";
import * as $ from "jquery";

// d3
type Selection<T1, T2 = T1> = d3.Selection<any, T1, any, T2>;

// powerbi
import DataView = powerbiVisualsApi.DataView;
import ISelectionId = powerbiVisualsApi.visuals.ISelectionId;
import PrimitiveValue = powerbiVisualsApi.PrimitiveValue;
import DataViewCategoryColumn = powerbiVisualsApi.DataViewCategoryColumn;
import IColorInfo = powerbiVisualsApi.IColorInfo;

// powerbi.extensibility.utils.test
import { createColorPalette, renderTimeout, MockISelectionManager, d3Click } from "powerbi-visuals-utils-testutils";

import { WordCloudData } from "./WordCloudData";
import { WordCloudBuilder } from "./WordCloudBuilder";
import { helpers } from "./helpers/helpers";
import areColorsEqual = helpers.areColorsEqual;

// WordCloud1447959067750
import { WordCloud as VisualClass } from "../src/WordCloud";
import { WordCloudText } from "../src/dataInterfaces";

/**
 * Extends the mock of ISelectionManager.
 * sendSelectionToHost is private method of ISelectionIdManager, so we don't have to add it to the test utils package.
 * Let's consider this ability if we have any other visuals with the same issue.
 */
MockISelectionManager.prototype["sendSelectionToHost"] = function (selectionIds: ISelectionId[]) {
    this.select(selectionIds);
};

describe("WordCloud", () => {
    let visualBuilder: WordCloudBuilder,
        defaultDataViewBuilder: WordCloudData,
        dataView: DataView;

    beforeEach(() => {
        visualBuilder = new WordCloudBuilder(1000, 500);
        defaultDataViewBuilder = new WordCloudData();

        dataView = defaultDataViewBuilder.getDataView();
    });

    // function that uses grep to filter DOM elements
    function grep(elements: HTMLElement[], text: string = "Afghanistan"): Element[] {
        return $.grep(elements, (element: Element) => {
            return element.innerHTML === "" || element.textContent === text;
        });
    }

    describe("Unit tests", () => {
        it("getFromCycledSequence returns array item by exact index", () => {
            let targetArr: number[] = [4, 4, 4, 5, 4, 4];
            let receivedNum = VisualClass.GET_FROM_CYCLED_SEQUENCE(targetArr, 3);
            expect(receivedNum).toEqual(5);
        });

        it("getFromCycledSequence returns array item by exact index with offset", () => {
            let targetArr: number[] = [4, 4, 4, 5, 4, 4];
            let receivedNum = VisualClass.GET_FROM_CYCLED_SEQUENCE(targetArr, 1, 2);
            expect(receivedNum).toEqual(5);
        });

        it("getFromCycledSequence returns array item by exceeded index", () => {
            let targetArr: number[] = [4, 4, 4, 5, 4, 4];
            let receivedNum = VisualClass.GET_FROM_CYCLED_SEQUENCE(targetArr, 9);
            expect(receivedNum).toEqual(5);
            receivedNum = VisualClass.GET_FROM_CYCLED_SEQUENCE(targetArr, 21);
            expect(receivedNum).toEqual(5);
        });

        it("getFromCycledSequence returns array item by exceeded index with offset", () => {
            let targetArr: number[] = [4, 4, 4, 5, 4, 4];
            let receivedNum = VisualClass.GET_FROM_CYCLED_SEQUENCE(targetArr, 4, 5);
            expect(receivedNum).toEqual(5);
            receivedNum = VisualClass.GET_FROM_CYCLED_SEQUENCE(targetArr, 14, 7);
            expect(receivedNum).toEqual(5);
            receivedNum = VisualClass.GET_FROM_CYCLED_SEQUENCE(targetArr, 7, 14);
            expect(receivedNum).toEqual(5);
        });

        it("getFromCycledSequence returns array item by negative index", () => {
            let targetArr: number[] = [4, 4, 4, 5, 4, 4];
            let receivedNum = VisualClass.GET_FROM_CYCLED_SEQUENCE(targetArr, -2);
            expect(receivedNum).toBeUndefined();
        });

        it("getFromCycledSequence returns array item by negative index and positive offset", () => {
            let targetArr: number[] = [4, 4, 4, 5, 4, 4];
            let receivedNum = VisualClass.GET_FROM_CYCLED_SEQUENCE(targetArr, -2, 5);
            expect(receivedNum).toEqual(5);
            receivedNum = VisualClass.GET_FROM_CYCLED_SEQUENCE(targetArr, -2, 1);
            expect(receivedNum).toBeUndefined();
        });

        it("getFromCycledSequence returns array item by positive index and negative offset", () => {
            let targetArr: number[] = [4, 4, 4, 5, 4, 4];
            let receivedNum = VisualClass.GET_FROM_CYCLED_SEQUENCE(targetArr, 3, -4);
            expect(receivedNum).toBeUndefined();
            receivedNum = VisualClass.GET_FROM_CYCLED_SEQUENCE(targetArr, 5, -2);
            expect(receivedNum).toEqual(5);
        });

        it("getFromCycledSequence returns array item by negative index and negative offset", () => {
            let targetArr: number[] = [4, 4, 4, 5, 4, 4];
            let receivedNum = VisualClass.GET_FROM_CYCLED_SEQUENCE(targetArr, -3, -3);
            expect(receivedNum).toBeUndefined();
        });

        it("Filter by count of items", () => {
            dataView.metadata.objects = {
                general: {
                    minRepetitionsToDisplay: 200
                }
            };
            const data = VisualClass.CONVERTER(dataView, createColorPalette(), visualBuilder.visualHost);
            expect(data.dataPoints.length).toEqual(74);
        });
    });

    describe("DOM tests", () => {
        it("svg element created", () => {
            expect(visualBuilder.mainElement[0]).toBeInDOM();
        });

        it("words mustn't intersect each other (rotation is disabled)", (done) => {
            let originalPreparedRandom: number[] = VisualClass.PreparedRandoms;
            dataView.categorical.categories[0].values = ["Abracadabra1", "Abracadabra2", "Abracadabra3", "Abracadabra4", "Abracadabra5", "Abracadabra6"];
            dataView.categorical.values[0].values = [20, 20, 20, 20, 20, 20];
            VisualClass.PreparedRandoms = [1];

            visualBuilder.updateRenderTimeout(dataView, () => {
                let boundedElements: any[] = [];

                const isIntersected = (firstBounded: ClientRect, secondBounded: ClientRect) => {
                    const leftBorder: number = Math.max(firstBounded.left, secondBounded.left);
                    const rightBorder: number = Math.min(firstBounded.right, secondBounded.right);
                    const topBorder: number = Math.max(firstBounded.top, secondBounded.top);
                    const botttomBorder: number = Math.min(firstBounded.bottom, secondBounded.bottom);
                    return (rightBorder > leftBorder && botttomBorder > topBorder);
                };

                visualBuilder.wordRects
                    .toArray()
                    .forEach((element: Element, index: number) => {
                        const domRect = element.getBoundingClientRect();
                        boundedElements.push({ "domRect": domRect, "id": index });
                    });

                for (let i: number = 0; i < boundedElements.length - 1; i++) {
                    for (let k: number = i + 1; k < boundedElements.length; k++) {
                        expect(isIntersected(boundedElements[i].domRect, boundedElements[k].domRect)).toBeFalsy();
                    }
                }

                VisualClass.PreparedRandoms = originalPreparedRandom;
                done();
            }, 500);
        });

        it("apply excludes", (done) => {
            dataView.categorical.categories[0].values = ["Afganistan", "Angola", "Rwanda", "Uganda", "Fiji", "Papua New Guinea"];

            dataView.metadata.objects = {
                stopWords: {
                    show: true,
                    words: "Papua New Guinea"
                }
            };

            // Should leave Angola and Fiji only
            // Afganistan, Rwanda, Uganda must be filtered by Excludes
            // Papua New Guinea must be filtered by StopWords option
            visualBuilder.updateRenderTimeout(dataView, () => {
                let length: number = visualBuilder.words.toArray().length;
                expect(length).toEqual(2);
                done();
            }, 500);
        });

        it("special characters Off with Word-breaking On", (done) => {
            dataView.categorical.categories[0].values = ["!!!!", "\"\"\"\"\"", "###", "%@@@", "????", ">>>>>", "C$$$", "M&Ms", "special characters"];

            dataView.metadata.objects = {
                general: {
                    isPunctuationsCharacters: false,
                    isBrokenText: true,
                }
            };

            let expectedWords: string[] = ["C", "M", "Ms", "special", "characters"];

            visualBuilder.updateRenderTimeout(dataView, () => {
                visualBuilder.wordText
                    .toArray()
                    .forEach((element: Element) => {
                        const text = $(element).text();
                        expect(expectedWords.some((value: string) => {
                            return text === value;
                        }));
                    });

                let length: number = visualBuilder.words.toArray().length;
                expect(length).toEqual(5);
                done();
            }, 500);
        });

        it("special characters Off with Word-breaking Off", (done) => {
            dataView.categorical.categories[0].values = ["!!!!", "\"\"\"\"\"", "###", "%@@@", "????", ">>>>>", "C$$$", "M&Ms", "special characters"];

            dataView.metadata.objects = {
                general: {
                    isPunctuationsCharacters: false,
                    isBrokenText: false,
                }
            };

            let expectedWords: string[] = ["C", "M Ms", "special characters"];

            visualBuilder.updateRenderTimeout(dataView, () => {
                visualBuilder.wordText
                    .toArray()
                    .forEach((element: Element) => {
                        const text = $(element).text();
                        expect(expectedWords.some((value: string) => {
                            return text === value;
                        }));
                    });

                let length: number = visualBuilder.words.toArray().length;
                expect(length).toEqual(3);
                done();
            }, 500);
        });

        it("special characters On", (done) => {
            dataView.categorical.categories[0].values = ["!!!!", "\"\"\"\"\"", "###", "%@@@", "????", ">>>>>", "C$$$", "M&Ms", "special characters"];

            dataView.metadata.objects = {
                general: {
                    isPunctuationsCharacters: true
                }
            };

            visualBuilder.updateflushAllD3TransitionsRenderTimeout(dataView, () => {
                visualBuilder.wordText
                    .toArray()
                    .forEach((element: Element) => {
                        const text = $(element).text();
                        expect(defaultDataViewBuilder.valuesCategoryValues.some((value: any[]) => {
                            return text === value[0];
                        }));
                    });

                let length: number = visualBuilder.words.toArray().length;
                expect(length).toEqual(10);

                done();
            }, 300);

        });

        it("basic update", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(visualBuilder.wordText.length)
                    .toBeGreaterThan(0);
                done();
            });
        });

        it("Word returns after word stop property is changed back", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                const stopWord = "Afghanistan";
                let texts = visualBuilder.wordText.toArray();
                expect(texts.length).toBeGreaterThan(0);

                dataView.metadata.objects = {
                    stopWords: {
                        show: true,
                        words: stopWord
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    texts = visualBuilder.wordText.toArray();
                    let withStopWord = texts.map(t => t.textContent).filter(t => t.includes(stopWord));
                    expect(withStopWord.length).toBe(0);
                    expect(texts.length).toBeGreaterThan(0);

                    (<any>dataView.metadata.objects).stopWords.show = false;

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        texts = visualBuilder.wordText.toArray();
                        withStopWord = texts.map(t => t.textContent).filter(t => t.includes(stopWord));
                        expect(withStopWord.length).toBeGreaterThan(0);
                        expect(texts.length).toBeGreaterThan(0);

                        done();
                    }, 700);
                }, 500);
            }, 300);
        });

        it("click on first visual, then click on the second visual doesn't remove items", (done) => {
            const secondVisualBuilder: WordCloudBuilder = new WordCloudBuilder(500, 1000);

            visualBuilder.update(dataView);

            secondVisualBuilder.updateRenderTimeout(dataView, () => {
                const firstWord: JQuery = visualBuilder.wordText.first();


                d3Click(
                    firstWord,
                    parseInt(firstWord.attr("x"), 10),
                    parseInt(firstWord.attr("y"), 10));

                setTimeout(() => {
                    const secondWord: JQuery = secondVisualBuilder.wordText.first();

                    d3Click(
                        secondWord,
                        parseInt(secondWord.attr("x"), 10),
                        parseInt(secondWord.attr("y"), 10));

                    setTimeout(() => {
                        expect(secondVisualBuilder.wordText.length)
                            .toBe(visualBuilder.wordText.length);

                        done();
                    });
                });
            }, 100);
        });

        it("click on first visual, then click on the second visual doesn't remove items", (done) => {
            defaultDataViewBuilder.valuesCategoryValues = [
                ["car collision hallway fall crash hallway", 1],
                ["car collision hallway hallway", 2],
                ["car collision person person car injure", 3]
            ];

            dataView = defaultDataViewBuilder.getDataView();

            visualBuilder.updateflushAllD3TransitionsRenderTimeout(dataView, () => {
                const texts: string[] = visualBuilder.wordText
                    .toArray()
                    .map((element: Element) => $(element).text());

                expect(texts.length).toEqual(lodash.difference(texts).length);

                done();
            }, 100);
        });

        it("multiple selection test", (done) => {
            visualBuilder.updateflushAllD3TransitionsRenderTimeout(dataView, () => {
                visualBuilder.wordClick("Afghanistan");

                renderTimeout(() => {
                    expect(visualBuilder.selectedWords.length).toBe(1);

                    visualBuilder.wordClick("Albania", true);

                    renderTimeout(() => {
                        expect(visualBuilder.selectedWords.length).toBe(2);

                        done();
                    });
                });
            }, 300);
        });

        it("max number of words test", (done) => {
            const maxNumberOfWords: number = 30;

            defaultDataViewBuilder.valuesCategoryValues.forEach((value: any[], index: number) => {
                value[1] = 1000 + index;
            });

            dataView = defaultDataViewBuilder.getDataView();

            dataView.metadata.objects = {
                general: {
                    maxNumberOfWords,
                    isBrokenText: false
                }
            };

            visualBuilder.updateflushAllD3TransitionsRenderTimeout(dataView, () => {
                expect(visualBuilder.wordText.length).toEqual(maxNumberOfWords);

                done();
            }, 300);
        });

        // Check only max number of words, without additional options
        it("Max number of words", done => {
            const numberOfWords: number = 10;

            dataView.metadata.objects = {
                general: {
                    maxNumberOfWords: numberOfWords
                }
            };

            visualBuilder.updateRenderTimeout(dataView, () => {
                let length: number = visualBuilder.words.toArray().length;
                expect(length).toBeLessThanOrEqual(numberOfWords);
                done();
            }, 500);
        });

        // Check only Word-breaking, without additional options
        it("Word-breaking option", done => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                let oldLength: number = visualBuilder.words.toArray().length;
                dataView.metadata.objects = {
                    general: {
                        isBrokenText: true
                    }
                };
                visualBuilder.updateRenderTimeout(dataView, () => {
                    let newLength: number = visualBuilder.words.toArray().length;
                    expect(newLength).toBeLessThanOrEqual(oldLength);
                    done();
                }, 500);
            }, 500);
        });

        it("words with special characters", (done) => {
            defaultDataViewBuilder.valuesCategoryValues = [
                ["email?!", 1],
                ["email@emil.ru", 2],
                ["<html_tag>", 3]
            ];

            dataView = defaultDataViewBuilder.getDataView();
            dataView.metadata.objects = {
                general: {
                    isBrokenText: false,
                    isPunctuationsCharacters: true
                }
            };

            visualBuilder.updateflushAllD3TransitionsRenderTimeout(dataView, () => {
                visualBuilder.wordText
                    .toArray()
                    .forEach((element: Element) => {
                        const text = $(element).text();
                        expect(defaultDataViewBuilder.valuesCategoryValues.some((value: any[]) => {
                            return text === value[0];
                        }));
                    });

                done();
            }, 300);
        });

        it("null word values test", () => {
            dataView.categorical.categories[0].values = dataView.categorical
                .categories[0]
                .values
                .map((value: PrimitiveValue, index: number) => {
                    return index % 2 === 0
                        ? null
                        : value;
                });

            expect(() => visualBuilder.update(dataView)).not.toThrowError();
        });
    });

    describe("Format settings test", () => {
        describe("Data color", () => {
            it("colors", (done) => {
                const mockColorPallete: powerbiVisualsApi.extensibility.IColorPalette = createColorPalette();
                let category: DataViewCategoryColumn;
                let colors: string[] = [];

                defaultDataViewBuilder
                    .valuesCategoryValues
                    .splice(0, defaultDataViewBuilder.valuesCategoryValues.length - 10);

                dataView = defaultDataViewBuilder.getDataView();

                category = dataView.categorical.categories[0];

                category.objects = category.objects || [];

                category.values.forEach((index: number) => {
                    const color: IColorInfo = mockColorPallete.getColor(index.toString());
                    colors.push(color.value);
                    category.objects[index] = {
                        dataPoint: {
                            fill: color.value
                        }
                    };
                });

                visualBuilder.updateRenderTimeout(dataView, () => {
                    visualBuilder.wordText
                        .toArray()
                        .forEach((element: Element) => {
                            const fillColor: string = $(element).css("fill");
                            expect(colors.some((color: string) => {
                                return fillColor === color;
                            }));
                        });

                    done();
                }, 1000);
            });
        });

        describe("Stop words", () => {
            beforeEach(() => {
                dataView.metadata.objects = {
                    stopWords: {
                        show: true
                    }
                };
            });

            it("show", done => {
                (<any>dataView.metadata.objects).stopWords.words = "Afghanistan";

                visualBuilder.updateRenderTimeout(dataView, () => {
                    expect(grep(visualBuilder.wordText.toArray()).length).toBe(0);

                    (<any>dataView.metadata.objects).stopWords.show = false;

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        expect(grep(visualBuilder.wordText.toArray()).length).toBeGreaterThan(0);

                        done();
                    }, 500);
                }, 500);
            });

            it("words", done => {
                checkStopWords(done);
            });

            it("words when word-breaking option is disabled", done => {
                (<any>dataView.metadata.objects).general = {
                    isBrokenText: false
                };

                checkStopWords(done);
            });

            function checkStopWords(done) {
                const stopWord = "Afghanistan";
                (<any>dataView.metadata.objects).stopWords.words = "";

                visualBuilder.updateRenderTimeout(dataView, () => {
                    expect(visualBuilder.wordText.toArray().length)
                        .toBeGreaterThan(0);

                    (<any>dataView.metadata.objects).stopWords.words = stopWord;

                    visualBuilder.updateRenderTimeout(dataView, () => {
                        const texts = visualBuilder.wordText.toArray();
                        const withStopWord = texts.map(t => t.textContent).filter(t => t.includes(stopWord));
                        expect(withStopWord.length).toBe(0);
                        done();
                    }, 500);
                }, 500);
            }
        });

        describe("Rotate text", () => {
            it("min/max angle", done => {
                const minAngle: number = -50,
                    maxAngle: number = 50;

                dataView.metadata.objects = {
                    rotateText: {
                        minAngle,
                        maxAngle
                    }
                };

                visualBuilder.updateRenderTimeout(dataView, () => {
                    visualBuilder.words
                        .toArray()
                        .forEach((element: Element) => {
                            const translateNode = <any>d3.select(element).node();
                            const matrix = translateNode.transform.baseVal.consolidate().matrix;
                            let { a, b } = matrix;
                            const rotate: number = Math.atan2(b, a) * 180 / Math.PI;

                            expect(rotate).toBeGreaterThan(minAngle);
                            expect(rotate).toBeLessThan(maxAngle);
                        });

                    done();
                }, 500);
            });
        });
    });

    describe("getCanvasContext", () => {
        let visualInstance: VisualClass;

        beforeEach(() => {
            visualInstance = visualBuilder.instance;
        });

        it("should return defined value", () => {
            let context: CanvasRenderingContext2D = visualInstance.canvasContext;

            expect(context).not.toBeUndefined();
            expect(context).not.toBeNull();
        });
    });

    describe("Selection", () => {
        it("Check index of the data-point after filtering", () => {
            const item: WordCloudText = VisualClass.CONVERTER(dataView, createColorPalette(), visualBuilder.visualHost)
                .texts
                .find((item: WordCloudText) => item.text === "Angola");
            expect(item.index).toBe(5);
        });
    });

    describe("Capabilities tests", () => {
        it("all items having displayName should have displayNameKey property", () => {
            jasmine.getJSONFixtures().fixturesPath = "base";

            let jsonData = getJSONFixture("capabilities.json");

            let objectsChecker: Function = (obj) => {
                const objKeys = Object.keys(obj);
                for (let property of objKeys) {
                    let value: any = obj[property];

                    if (value.displayName) {
                        expect(value.displayNameKey).toBeDefined();
                    }

                    if (typeof value === "object") {
                        objectsChecker(value);
                    }
                }
            };

            objectsChecker(jsonData);
        });
    });

    describe("Accessibility", () => {
        describe("High contrast mode", () => {
            const backgroundColor: string = "#000000";
            const foregroundColor: string = "#ffff00";

            beforeEach(() => {
                visualBuilder.visualHost.colorPalette.isHighContrast = true;

                visualBuilder.visualHost.colorPalette.background = { value: backgroundColor };
                visualBuilder.visualHost.colorPalette.foreground = { value: foregroundColor };
            });

            it("should render all of render with foreground color applied", (done) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    const words: JQuery<any>[] = visualBuilder.wordText.toArray().map($);

                    expect(isColorAppliedToElements(words, foregroundColor, "fill"));

                    done();
                });
            });

            function isColorAppliedToElements(
                elements: JQuery[],
                color?: string,
                colorStyleName: string = "fill"
            ): boolean {
                return elements.some((element: JQuery) => {
                    const currentColor: string = element.css(colorStyleName);

                    if (!currentColor || !color) {
                        return currentColor === color;
                    }

                    return areColorsEqual(currentColor, color);
                });
            }
        });
    });
});
