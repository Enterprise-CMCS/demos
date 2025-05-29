import React, { Fragment } from "react";
import { DemonstrationColumns } from "components/table/columns/DemonstrationColumns";
import { TableSection } from "components/table/sections/TableSection";
import DemonstrationTable from "components/table/tables/DemonstrationTable";
import { Header, Main, Footer } from "components";
import { LoginButton } from "components/button/LoginButton";
import DemoData from "faker_data/demonstrations.json";

const LandingPage: React.FC = () => {
  return (
    <Fragment>
      <Header />
      <Main>
        <h1 className="text-2xl font-bold">Welcome to DEMOS</h1>
        <LoginButton className="mt-4" />
        <div className="overflow-auto">
          <TableSection title="Demonstration Table">
            <DemonstrationTable
              data={DemoData}
              columns={DemonstrationColumns}
            />
          </TableSection>
        </div>
      </Main>
      <Footer />
    </Fragment>
  );
};

export default LandingPage;
