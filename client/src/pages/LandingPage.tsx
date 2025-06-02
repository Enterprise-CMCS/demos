import React, { Fragment } from "react";
import { DemonstrationColumns } from "components/table/columns/DemonstrationColumns";
import { TableSection } from "components/table/sections/TableSection";
import DemonstrationTable from "components/table/tables/DemonstrationTable";
import { Header, Main, Footer } from "components";
import { PrimaryButton } from "components/button/PrimaryButton";
import DemoData from "faker_data/demonstrations.json";

const LandingPage: React.FC = () => {
  const navigate = useNavigation()
  return (
    <Fragment>
      <Header />
      <Main>
        {/* <h1 className="text-2xl font-bold">Welcome to DEMOS</h1> */}
        <PrimaryButton onclick={() => navigate("/login")}>Login</ PrimaryButton>
        <div className="overflow-auto">
          <TableSection title="Demonstrations">
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
