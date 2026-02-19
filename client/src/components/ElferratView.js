import React, { useContext } from 'react';
import styled from 'styled-components';
import { SitzungContext } from '../context/SitzungContext';
import ZettelSystem from './ZettelSystem';

const Container = styled.div`
  max-width: 100%;
  margin: 0 auto;
  padding: 10px;
  min-height: calc(100vh - 60px);
  background: #000;
`;

const NoSitzungMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 100px);
  font-size: 1.2rem;
  color: #ccc;
  text-align: center;
  padding: 20px;
`;

function ElferratView() {
  const { aktiveSitzung } = useContext(SitzungContext);

  if (!aktiveSitzung) {
    return (
      <NoSitzungMessage>
        Keine aktive Sitzung ausgewählt. Bitte wählen Sie eine Sitzung aus.
      </NoSitzungMessage>
    );
  }

  return (
    <Container>
      <ZettelSystem viewType="elferrat" alwaysShowHistorie />
    </Container>
  );
}

export default ElferratView;