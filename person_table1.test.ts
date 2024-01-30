import { Pair, List, head, tail, pair, is_null } from "../lib/list";
import {probe_linear, ph_empty, ph_insert, ph_lookup, ProbingFunction, ProbingHashtable, hash_id} from "../lib/hashtables";
/* DO NOT MODIFY these type declarations */
export type People = Array<Pair<number, string>>;
export type Relations = Array<Pair<number, number>>;
export type Person = {
  id: number, //the identifier as described above
  name: string,
  parents: Array<number>,
  children: Array<number>
};
export type PersonTable = ProbingHashtable<number, Person>;
/**
 * Create a hash table of PErson records based on given relations
 * @precondition All ids appearing in relations are in the people list.
 * @param people peoples ids and names
 * @param relations parent-child relations
 * @returns Returns a hash table with a Person record for each person from people that icludes all relationships according to relations
 */
export function toHashTable(people: People, relations: Relations): PersonTable {
  const hashTable: PersonTable = ph_empty(100, probe_linear<number>(hash_id));
  function get_or_create(id: number): Person {
    const existingPerson = ph_lookup(hashTable, id);
    if (existingPerson !== undefined) {
      return existingPerson;
    }
    const newPerson: Person = {
      id,
      name: '',
      parents: [],
      children: [],
    };
    ph_insert(hashTable, id, newPerson);
    hashTable.size += 1;
    return newPerson;
  }
  people.forEach(([id, name]) => {
    const person = get_or_create(id);
    person.name = name;
  });
  relations.forEach(([parentID, childID]) => {
    const parent = get_or_create(parentID);
    const child = get_or_create(childID);
    parent.children.push(childID);
    child.parents.push(parentID);
  });
  return hashTable;
}
/**
 * Computes the descendants of a person.
 * @param ht Relationships of people
 * @param id Identification number of the person to compute the descendants for
 * @returns Returns all the descendants of the person with ID id, according to
 *     the relationships in ht, or undefined if the person with ID is not
 *     found in ht.
 */
export function descendants(ht: PersonTable, id: number): Array<number> | undefined {
  const person = ph_lookup(ht, id);

  if (!person) {
    // If person with the given ID is not found we return undefined
    return undefined;
  }
  const descendantsList: Array<number> = [];
  const visited: Set<number> = new Set(); // Keep track of visited nodes

  // DFS to find descendants
  function dfs(currentPerson: Person) {
    visited.add(currentPerson.id); // Mark the current person as visited

    currentPerson.children.forEach((childID) => {
      if (!visited.has(childID)) {
        descendantsList.push(childID);
        const child = ph_lookup(ht, childID);
        if (child) {
          dfs(child);
        }
      }
    });
  }

  dfs(person);

  return descendantsList;
}

test('creates a hash table with people and relations', () => {
  const people: People = [[1, 'John'], [2, 'Alice']];
  const relations: Relations = [[1, 2]];
  const result = toHashTable(people, relations);
  expect(result).toBeDefined();
});
test('handles an empty list of people and relations', () => {
  const result = toHashTable([], []);
  expect(result).toBeDefined();
});
test('creates a hash table with a single person', () => {
  const people: People = [[1, 'John']];
  const relations: Relations = [];
  const result = toHashTable(people, relations);
  expect(result).toBeDefined();
});
test('handles relations without corresponding people', () => {
  const people: People = [[1, 'John']];
  const relations: Relations = [[1, 2]];
  const result = toHashTable(people, relations);
  expect(result).toBeDefined();
});
test('handles duplicate relations', () => {
  const people: People = [[1, 'John'], [2, 'Alice']];
  const relations: Relations = [[1, 2], [1, 2]];
  const result = toHashTable(people, relations);
  expect(result).toBeDefined();
});
test('creates a hash table with a whole family', () => {
  const people: People = [
    [19500101, 'Grandparent1'],
    [19500201, 'Grandparent2'],
    [19750101, 'Parent'],
    [20000101, 'Grandchild'],
  ];

  const relations: Relations = [
    [19500101, 19750101], // Grandparent1 is parent of Parent
    [19500201, 19750101], // Grandparent2 is parent of Parent
    [19750101, 20000101], // Parent is parent of Grandchild
  ];
  const result = toHashTable(people, relations);
  expect(result).toBeDefined();
  const grandparent1 = result.data.find(person => person?.id === 19500101);
  const grandparent2 = result.data.find(person => person?.id === 19500201);
  const parent = result.data.find(person => person?.id === 19750101);
  const grandchild = result.data.find(person => person?.id === 20000101);
  expect(grandparent1).toBeDefined();
  expect(grandparent2).toBeDefined();
  expect(parent).toBeDefined();
  expect(grandchild).toBeDefined();
  // Validate the relations
  expect(grandparent1!.children).toContain(19750101);
  expect(grandparent2!.children).toContain(19750101);
  expect(parent!.parents).toContain(19500101);
  expect(parent!.parents).toContain(19500201);
  expect(parent!.children).toContain(20000101);
});

/** Test cases for descendants function */
test('descendants for a person with no descendants', () => {
  const people: People = [[1, 'John']];
  const relations: Relations = [];
  const hashTable: PersonTable = toHashTable(people, relations);
  const result = descendants(hashTable, 1);
  expect(result).toEqual([]);
});

test('descendants for a person with one level of descendants', () => {
  const people: People = [
    [1, 'John'],
    [2, 'Alice'],
  ];
  const relations: Relations = [
    [1, 2], // John is parent of Alice
  ];
  const hashTable = toHashTable(people, relations);
  const result = descendants(hashTable, 1);
  expect(result).toEqual([2]);
});

test('multiple descendants', () => {
  const people : People = [
    [1, 'John'],
    [2, 'Alice'],
    [3, 'Bob'],
  ];
  const relations: Relations = [
    [1, 2], // John is parent of Alice
    [1, 3], // John is parent of Bob
  ];
  const hashTable = toHashTable(people, relations);
  const result = descendants(hashTable, 1);
  expect(result).toEqual([2, 3]);
});

test('descendants for a person not in the hash table', () => {
  const people : People = [
    [1, 'John'],
    [2, 'Alice'],
  ];
  const relations: Relations = [
    [1, 2], // John is parent of Alice
  ];
  const hashTable = toHashTable(people, relations);
  const result = descendants(hashTable, 3); // Person with ID 3 not in hash table
  expect(result).toBeUndefined();
});

test('descendants for a person with circular relationships', () => {
  const people : People = [
    [1, 'John'],
    [2, 'Alice'],
  ];
  const relations : Relations = [
    [1, 2], // John is parent of Alice
    [2, 1], // Circular relationship: Alice is parent of John
  ];
  const hashTable = toHashTable(people, relations);
  const result = descendants(hashTable, 1);
  expect(result).toEqual([2]); // Should not enter into circular relationship
});