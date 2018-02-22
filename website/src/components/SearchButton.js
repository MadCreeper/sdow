import _ from 'lodash';
import axios from 'axios';
import React from 'react';

import Button from './Button';

import {SDOW_API_URL} from '../resources/constants';

export const SearchButtonButton = Button.extend`
  width: 240px;
  height: 68px;
  margin: 0 auto 40px;
  font-size: 32px;
  border-radius: 8px;
`;

class SearchButton extends React.Component {
  constructor() {
    super();

    this.fetchShortestPaths = this.fetchShortestPaths.bind(this);
  }

  fetchShortestPaths() {
    const {
      sourcePageTitle,
      targetPageTitle,
      setErrorMessage,
      setIsFetchingResults,
      setShortestPathResults,
    } = this.props;

    let inputValidationErrorMessage;
    if (sourcePageTitle === '' && targetPageTitle === '') {
      inputValidationErrorMessage =
        'You might want to choose a start and end page above before you hit that.';
    } else if (sourcePageTitle === '') {
      inputValidationErrorMessage =
        'You might want to choose a start page above before you hit that.';
    } else if (targetPageTitle === '') {
      inputValidationErrorMessage =
        'You might want to choose an end page above before you hit that.';
    }

    if (typeof inputValidationErrorMessage !== 'undefined') {
      setErrorMessage(inputValidationErrorMessage);
    } else {
      setIsFetchingResults(true);

      axios({
        url: `${SDOW_API_URL}/paths`,
        method: 'POST',
        data: {
          source: sourcePageTitle,
          target: targetPageTitle,
        },
      })
        .then((response) => {
          const {pages, paths} = response.data;

          const pathsDenormalized = paths.map((path) => {
            return path.map((pageId) => {
              return pages[pageId];
            });
          });

          setShortestPathResults({
            targetPageTitle,
            sourcePageTitle,
            paths: pathsDenormalized,
          });

          // TODO: measure the response time
          // See https://www.html5rocks.com/en/tutorials/webperformance/usertiming/
        })
        .catch((error) => {
          // TODO: add Sentry logging here (or just Google Analytics)
          if (error.message === 'Network Error') {
            // This can happen when the server is down, the Flask app is not running, or when the
            // FLASK_DEBUG environment variable is set to 1 and there is a 5xx server error (see
            // https://github.com/corydolphin/flask-cors/issues/67 for details).
            setErrorMessage(
              'Whoops... Six Degrees of Wikipedia is temporarily unavailable. Please try again in a few seconds.'
            );
          } else {
            // This can happen when there is a 4xx or 5xx error (except for the case noted in the
            // comment above).
            const defaultErrorMessage =
              'Whoops... something is broken and has been reported. In the mean time, please try a different search.';
            setErrorMessage(_.get(error, 'response.data.error', defaultErrorMessage));
          }
        });
    }
  }

  render() {
    const {isFetchingResults} = this.props;

    if (isFetchingResults) {
      return null;
    }

    return <SearchButtonButton onClick={this.fetchShortestPaths}>Go!</SearchButtonButton>;
  }
}

export default SearchButton;
