# SubQuery - Index stakers for the dApp Lucky in Shibuya/Shiden/Astar Networks

This project index: 
- all accounts staking in the given dApp 
- all rewards received by the given dApp

## Preparation

#### Environment

- [Typescript](https://www.typescriptlang.org/) are required to compile project and define types.

- Both SubQuery CLI and generated Project have dependencies and require [Node](https://nodejs.org/en/).

#### Install 

Last, under the project directory, run following command to install all the dependency.

```
yarn install
```

## Configure your project

You will be mainly working on the following files:

- The Manifest in `project.yaml`
- The GraphQL Schema in `schema.graphql`
- The Mapping functions in `src/mappings/` directory

For more information on how to write the SubQuery,
check out our doc section on [Define the SubQuery](https://doc.subquery.network/define_a_subquery.html)

#### Code generation

In order to index your SubQuery project, it is mandatory to build your project first.
Run this command under the project directory.

```
yarn codegen
```

## Build the project

In order to deploy your SubQuery project to our hosted service, it is mandatory to pack your configuration before upload.
Run pack command from root directory of your project will automatically generate a `your-project-name.tgz` file.

```
yarn build
```

## Indexing and Query

#### Run required systems in docker

Under the project directory run following command:

```
docker-compose pull && docker-compose up
```

#### Query the project

Open your browser and head to `http://localhost:3000`.

Finally, you should see a GraphQL playground is showing in the explorer and the schemas that ready to query.


Query stakers for era 2100 and dApp's rewards for era 2100 
```graphql
query {
  stakes(filter: { era: {  lessThanOrEqualTo: "2100" } }) {
    groupedAggregates(
      groupBy: [ACCOUNT_ID], 
      having: { sum: {amount: { notEqualTo: "0" }}}
    ) {
      sum{amount}, keys
    }
  }
  developerRewards(filter: { era: { equalTo: "2100" } }) {
    nodes {amount, era}
  }
}
```

Query stakers for era 2100
```graphql
query {
  accounts {
    nodes {
      id
      stakes(filter: { era: { lessThanOrEqualTo: "2100" } }) {
        aggregates{
          sum {
            amount
          }
        }
        groupedAggregates(groupBy: [ACCOUNT_ID]) {
          sum{amount}
        	keys
        }        
        nodes {
          accountId
          amount
          era
        }
      }
    }
  }
  developerRewards {
    nodes {
      amount
      era
    }
  }
  palletInfos {
    nodes {
      currentEra
    }
  }
}

```