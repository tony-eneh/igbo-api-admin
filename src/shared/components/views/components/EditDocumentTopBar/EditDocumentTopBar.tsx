import React, { ReactElement } from 'react';
import { Box, Button, Heading } from '@chakra-ui/react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import View from 'src/shared/constants/Views';
import Collection from 'src/shared/constants/Collections';
import { Select } from 'src/shared/components';
import { determineCreateSuggestionRedirection } from 'src/shared/utils';
import DocumentTopBarInterface from './DocumentTopBarInterface';

const CreateSuggestion = ({
  record,
  resource,
  push,
}: {
  record: Record<any, any>,
  resource: string,
  push: (value: any) => void,
}): ReactElement => (
  <Button
    colorScheme="green"
    onClick={() => determineCreateSuggestionRedirection({ record, resource, push })}
  >
    Suggest an Edit
  </Button>
);

const EditDocumentTopBar = ({
  resource,
  record,
  view,
  title,
  push,
  permissions,
}: DocumentTopBarInterface): ReactElement => {
  const determineMergeCollection = () => (
    resource === Collection.EXAMPLE_SUGGESTIONS ? Collection.EXAMPLES : Collection.WORDS
  );

  return (
    view === View.EDIT ? (
      <Box className="flex flex-col lg:flex-row lg:justify-between">
        <Heading as="h1" className="text-3xl text-gray-800 mb-3">{title}</Heading>
      </Box>
    ) : (
      <Box className="flex flex-col lg:flex-row justify-between">
        <Heading as="h1" className="text-3xl text-gray-800 mb-3 lg:mb-0">{title}</Heading>
        {resource !== Collection.EXAMPLES && resource !== Collection.WORDS ? (
          <Box className="flex flex-col mb-5">
            <Heading as="h1" className="text-2xl text-gray-800">Editor Actions:</Heading>
            <Select
              view={View.SHOW}
              resource={resource}
              collection={determineMergeCollection()}
              record={record}
              permissions={permissions}
              label="Editor's Actions"
            />
          </Box>
        ) : (
          <CreateSuggestion
            record={record}
            resource={resource}
            push={push}
          />
        )}
      </Box>
    )
  );
};

export default withRouter(connect(null, {
  push,
})(EditDocumentTopBar));
