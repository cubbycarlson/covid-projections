import React from 'react';

import {
  ChartContentWrapper,
  MainContentInner,
  ChartHeader,
  ChartDescription,
  ChartLocationName,
  BetaTag,
} from './ChartsHolder.style';
import LocationPageHeader from 'components/LocationPage/LocationPageHeader';
import NoCountyDetail from './NoCountyDetail';
import ModelChart from 'components/Charts/ModelChart';
import { Projections } from 'models/Projections';
import { Projection } from 'models/Projection';
import SummaryStats from 'components/SummaryStats/SummaryStats';
import Disclaimer from 'components/Disclaimer/Disclaimer';
import { ZoneChartWrapper } from 'components/Charts/ZoneChart.style';
import Chart from 'components/Charts/Chart';
import ClaimStateBlock from 'components/ClaimStateBlock/ClaimStateBlock';
import ShareModelBlock from '../../components/ShareBlock/ShareModelBlock';

import {
  optionsRt,
  optionsHospitalUsage,
  optionsPositiveTests,
} from 'components/Charts/zoneUtils';
import {
  Level,
  CASE_GROWTH_RATE,
  POSITIVE_TESTS,
  HOSPITAL_USAGE,
  determineZone,
  ChartType,
  ChartTypeToTitle,
} from 'enums/zones';
import { formatDate } from 'utils';
// TODO(michael): These format helpers should probably live in a more
// general-purpose location, not just for charts.
import { formatDecimal, formatPercent } from 'components/Charts/utils';

const ChartsHolder = (props: {
  projections: Projections;
  stateId: string;
  countyId: string;
}) => {
  const projection: Projection = props.projections.primary;
  const noInterventionProjection: Projection = props.projections.baseline;

  // TODO(michael): This should probably be some function of today's date?
  const endDate = new Date('2020-05-15');

  const { rtRangeData, testPositiveData, icuUtilizationData } = getChartData(
    projection,
  );

  const getChartSummarys = (projection: Projection) => {
    return {
      [ChartType.CASE_GROWTH_RATE]: projection.rt,
      [ChartType.HOSPITAL_USAGE]: projection.currentIcuUtilization,
      [ChartType.POSITIVE_TESTS]: projection.currentTestPositiveRate,
    };
  };

  return (
    <>
      {!projection ? (
        <NoCountyDetail countyId={props.countyId} stateId={props.stateId} />
      ) : (
        <ChartContentWrapper>
          <LocationPageHeader projections={props.projections} />
          <SummaryStats stats={getChartSummarys(projection)} />
          <MainContentInner>
            <ChartHeader>
              {ChartTypeToTitle[ChartType.CASE_GROWTH_RATE]}
            </ChartHeader>
            <ChartLocationName>{projection.locationName}</ChartLocationName>
            <ChartDescription>
              {caseGrowthStatusText(projection)}
            </ChartDescription>
            {rtRangeData && (
              <>
                <ZoneChartWrapper>
                  <Chart options={optionsRt(rtRangeData, endDate) as any} />
                </ZoneChartWrapper>
                <Disclaimer metricName="infection growth rate">
                  Most experts recommend an infection rate of less than 1.0
                  before reopening.
                </Disclaimer>
              </>
            )}
            <ChartHeader>
              {ChartTypeToTitle[ChartType.POSITIVE_TESTS]}
            </ChartHeader>
            <ChartLocationName>{projection.locationName}</ChartLocationName>
            <ChartDescription>
              {positiveTestsStatusText(projection)}
            </ChartDescription>
            {testPositiveData && (
              <>
                <ZoneChartWrapper>
                  <Chart
                    options={
                      optionsPositiveTests(testPositiveData, endDate) as any
                    }
                  />
                </ZoneChartWrapper>
                <Disclaimer metricName="positive test rate">
                  The World Health Organization recommends a positive test rate
                  of less than 10% before reopening. The countries most
                  successful in containing COVID have rates of 3% or less.
                </Disclaimer>
              </>
            )}
            <ChartHeader>
              {ChartTypeToTitle[ChartType.HOSPITAL_USAGE]}
              <BetaTag>Beta</BetaTag>
            </ChartHeader>
            <ChartLocationName>{projection.locationName}</ChartLocationName>
            <ChartDescription>
              {hospitalOccupancyStatusText(projection)}
            </ChartDescription>
            {icuUtilizationData && (
              <>
                <ZoneChartWrapper>
                  <Chart
                    options={
                      optionsHospitalUsage(icuUtilizationData, endDate) as any
                    }
                  />
                </ZoneChartWrapper>
                <Disclaimer metricName="COVID ICU usage">
                  While experts agree surge healthcare capacity is critical,
                  there is no benchmark for ICU surge capacity. This metric
                  attempts to model capacity as interventions are relaxed.
                </Disclaimer>
              </>
            )}
            <ChartHeader>Future projections: all hospitalizations</ChartHeader>
            <ChartLocationName>{projection.locationName}</ChartLocationName>
            <ChartDescription>
              {generateChartDescription(projection, noInterventionProjection)}
            </ChartDescription>
            <ModelChart
              projections={props.projections}
              height={''}
              condensed={false}
              forCompareModels={false}
            />
          </MainContentInner>
          <ShareModelBlock
            condensed={false}
            stateId={props.stateId}
            county={props.countyId}
          />
          <ClaimStateBlock
            stateId={props.stateId}
            countyName={props.countyId}
          />
        </ChartContentWrapper>
      )}
    </>
  );
};

function generateChartDescription(
  projection: Projection,
  noInterventionProjection: Projection,
) {
  // TODO(sgoldblatt): figure out how to get people number data from projection
  if (projection.dateOverwhelmed) {
    return (
      `Projections indicate that many additional people will ` +
      `be hospitalized in the next 3 months. At this rate, ${projection.locationName} ` +
      `hospitals may become overloaded by ${formatDate(
        projection.dateOverwhelmed,
      )}.`
    );
  } else {
    const noInterventionDate = noInterventionProjection.dateOverwhelmed;
    const restrictionsLiftedText =
      noInterventionDate &&
      `If all restrictions were lifted today, hospitals would become overloaded by ${formatDate(
        noInterventionDate,
      )}.`;

    return (
      `Projections indicate that ${projection.locationName} hospitals are unlikely to become overloaded in the next 3 months. ` +
      `${restrictionsLiftedText || ''}`
    );
  }
}

// Exported for use by AllStates.js.
export function getChartData(
  projection: Projection,
): { rtRangeData: any; testPositiveData: any; icuUtilizationData: any } {
  const rtRangeData =
    projection &&
    projection.rt &&
    projection.getDataset('rtRange').data.map(d => ({
      x: d.x,
      y: d.y?.rt,
      low: d.y?.low,
      hi: d.y?.high,
    }));

  const testPositiveData =
    projection &&
    projection.currentTestPositiveRate &&
    projection.getDataset('testPositiveRate').data;

  const icuUtilizationData =
    projection &&
    projection.currentIcuUtilization &&
    projection.getDataset('icuUtilization').data;

  return { rtRangeData, testPositiveData, icuUtilizationData };
}

function caseGrowthStatusText(projection: Projection) {
  const rt = projection.rt!;
  if (rt === null) {
    return 'No case load data is available.';
  }
  const level = determineZone(CASE_GROWTH_RATE, rt);
  const additionalPeople = formatDecimal(rt);
  const infectionRate = `On average, each person in ${projection.locationName} with COVID is infecting ${additionalPeople} other people.`;

  const epidemiologyReasoning = levelText(
    level,
    `Because each person is infecting less than one other person, the total number of cases in ${projection.locationName} is shrinking.`,
    `Because this number is only slightly above 1.0, it means that COVID is growing, but slowly.`,
    `As such, the total number of cases in ${projection.locationName} is growing exponentially.`,
  );

  return `${infectionRate} ${epidemiologyReasoning}`;
}

function positiveTestsStatusText(projection: Projection) {
  const testPositiveRate = projection.currentTestPositiveRate;
  if (testPositiveRate === null) {
    return 'No testing data is available.';
  }
  const level = determineZone(POSITIVE_TESTS, testPositiveRate);
  const lowSizableLarge = levelText(
    level,
    'low',
    'relatively sizable',
    'relatively large',
  );
  const percentage = formatPercent(testPositiveRate);

  const location = projection.locationName;
  const testingBroadlyText = levelText(
    level,
    `which suggests enough widespread, aggressive testing to catch most/all cases in ${location}`,
    `which indicates that testing in ${location} is not widespread enough to detect all cases`,
    `which indicates that testing in ${location} is limited, meaning that many cases may go undetected`,
  );

  return `A ${lowSizableLarge} percentage (${percentage}) of COVID tests were positive, ${testingBroadlyText}.`;
}

function hospitalOccupancyStatusText(projection: Projection) {
  const icuUtilization = projection.currentIcuUtilization;
  const currentlyInICU = projection.currentICUPatients;
  if (icuUtilization === null || currentlyInICU == null) {
    return 'No ICU occupancy data is available.';
  }
  const level = determineZone(HOSPITAL_USAGE, icuUtilization);

  const location = projection.locationName;
  const capacity = projection.totalICUCapacity;
  const normallyFree = Math.floor(projection.typicallyFreeICUCapacity);
  const percentUtilization = Math.round((100 * currentlyInICU) / normallyFree);

  const lowText = `This suggests there is enough capacity to absorb a
      wave of new COVID hospitalizations.`;
  const mediumText = `This suggests less ability to absorb a wave of
      new COVID hospitalizations.`;
  const highText = `This suggests the healthcare system may struggle
       to absorb a wave of new COVID hospitalizations.`;

  return `${location} has ${capacity} ICU Beds. Normally ${normallyFree} are unoccupied.
      We estimate there are currently ${currentlyInICU} COVID cases in the ICU,
      or ${percentUtilization}% of typically free beds. ${levelText(
    level,
    lowText,
    mediumText,
    highText,
  )}`;
}

/**
 * Depending on provided `level`, returns the provided `lowText`, `mediumText`,
 * or `highText`.
 */
function levelText(
  level: Level,
  lowText: string,
  mediumText: string,
  highText: string,
) {
  return level === Level.LOW
    ? lowText
    : level === Level.MEDIUM
    ? mediumText
    : highText;
}

export default ChartsHolder;
