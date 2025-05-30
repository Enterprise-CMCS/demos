import React, { Fragment } from "react";
import { DemonstrationColumns } from "components/table/columns/DemonstrationColumns";
import { TableSection } from "components/table/sections/TableSection";
import DemonstrationTable from "components/table/tables/DemonstrationTable";
import { Header, Main, Footer } from "components";
import DemoData from "faker_data/demonstrations.json";


const Demonstrations: React.FC = () => {
  return (
    <Fragment>
      <Header />
      <Main>
        <div className="p-6">
          <h1 className="text-2xl font-bold">Demonstrations</h1>
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

export default Demonstrations;
