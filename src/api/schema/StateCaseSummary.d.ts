/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Run 'yarn update-api-types' to regenerate.
 */

/**
 * 2 letter state code
 */
export type State = string;
/**
 * ISO 8601 Date of latest data
 */
export type Date = string;
/**
 * Cumulative case count.
 */
export type Cases = number;
/**
 * Cumulative deaths count.
 */
export type Deaths = number;
/**
 * FIPS state code + FIPS county code
 */
export type Fips = string;
/**
 * Cumulative case count.
 */
export type Cases1 = number;
/**
 * Cumulative deaths count.
 */
export type Deaths1 = number;
/**
 * ISO 8601 Date of latest data
 */
export type Date1 = string;
export type Counties = _CountyCases[];

/**
 * Case summary output in format that website expects for embeds.
 */
export interface StateCaseSummary {
  state: State;
  date: Date;
  cases: Cases;
  deaths: Deaths;
  counties: Counties;
}
export interface _CountyCases {
  fips: Fips;
  cases: Cases1;
  deaths: Deaths1;
  date: Date1;
}
