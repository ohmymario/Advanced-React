function Person(name, foods) {
  this.name = name;
  this.foods = foods;
}

Person.prototype.fetchFavFoods = function() {
  return new Promise((resolve, reject) => {
    // simulate an API
    setTimeout(() => resolve(this.foods), 2000);
  });
};

describe('mocking learning', () => {
  it('mocks a regular function', () => {
    const fetchDogs = jest.fn();
    fetchDogs('snickers');
    expect(fetchDogs).toHaveBeenCalled();
    expect(fetchDogs).toHaveBeenCalledWith('snickers');
    fetchDogs('hugo');
    expect(fetchDogs).toHaveBeenCalledTimes(2);
  });

  it('Can create a person', () => {
    const me = new Person('Mario', ['Pizza', 'Burgers']);
    expect(me.name).toBe('Mario');
  });

  it('can fetch food', async () => {
    const me = new Person('Mario', ['Pizza', 'Burgers']);
    // Mock the favfoods function
    me.fetchFavFoods = jest.fn().mockResolvedValue(['sushi', 'ramen']);

    const favFoods = await me.fetchFavFoods();
    expect(favFoods).toContain('sushi');
  });
});
