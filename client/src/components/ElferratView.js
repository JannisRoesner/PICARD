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

const HeaderCard = styled.div`
  background: #1a1a1a;
  border: 2px solid #333;
  border-radius: 10px;
  padding: 18px;
  max-width: 900px;
  margin: 10px auto 0 auto;
`;

const Title = styled.h1`
  margin: 0 0 8px 0;
  color: ${props => props.theme?.colors?.primary || '#fbbf24'};
  font-size: 1.4rem;
`;

const Description = styled.p`
  margin: 0;
  color: #ddd;
  line-height: 1.5;
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
      <HeaderCard>
        <Title>Elferrat</Title>
        <Description>
          Diese Ansicht arbeitet als Elferrat-Posten. Der Elferrat erhält dieselben eingehenden Zettel wie die Moderation.
          Ein separater Empfänger „An Elferrat“ existiert bewusst nicht – bitte dafür immer „An Moderation“ verwenden.
        </Description>
      </HeaderCard>

      <ZettelSystem viewType="elferrat" />
    </Container>
  );
}

export default ElferratView;